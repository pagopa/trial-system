import { describe, expect, it } from 'vitest';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { Database, ErrorResponse } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import {
  anActivationJob,
  anActivationRequest,
  anInsertActivationRequest,
} from '../../../../domain/__tests__/data';
import { makeActivationRequestReaderWriter } from '../activation-request';
import { ActivationRequestId } from '../../../../domain/activation-request';
import { ItemAlreadyExists } from '../../../../domain/errors';

const makeTestData = (length: number) => {
  // Create an array of ActivationRequest, changing the id property
  const activationRequests = Array.from({ length }, (_, i) => ({
    ...anActivationRequest,
    id: `${i}` as ActivationRequestId,
  }));
  // Create chunks of size 99
  const chunks = RA.chunksOf(99)(activationRequests);
  const operationChunks = pipe(
    chunks,
    RA.map((chunk) =>
      pipe(
        chunk,
        // Convert every element of the chunk to its Batch Operation
        RA.map(({ id, _etag }) => ({
          operationType: 'Patch',
          id,
          ifMatch: _etag,
          resourceBody: {
            operations: [
              {
                op: 'replace',
                path: '/activated',
                value: true,
              },
            ],
          },
        })),
        // For every chunk, append the operation to update the job
        RA.appendW({
          operationType: 'Patch',
          id: anActivationJob.trialId,
          resourceBody: {
            operations: [
              {
                op: 'incr',
                path: '/usersActivated',
                // Increment for the value of the elements in the chunk
                value: chunk.length,
              },
            ],
          },
        }),
      ),
    ),
  );

  return {
    activationRequests,
    operationChunks,
  };
};

describe('makeActivationRequestRepository', () => {
  describe('insert', () => {
    it('should return the inserted item', async () => {
      const mockDB = makeDatabaseMock();

      mockDB
        .container('')
        .items.create.mockResolvedValueOnce({ resource: anActivationRequest });

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).insert(anInsertActivationRequest)();

      expect(actual).toStrictEqual(E.right(anActivationRequest));
      expect(mockDB.container('').items.create).toBeCalledWith(
        anInsertActivationRequest,
      );
    });
    it('should return ItemAlreadyExists if the item already exists', async () => {
      const mockDB = makeDatabaseMock();
      const error = new ErrorResponse('');
      // eslint-disable-next-line functional/immutable-data
      error.code = 409;

      mockDB.container('').items.create.mockRejectedValueOnce(error);

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).insert(anInsertActivationRequest)();

      expect(actual).toMatchObject(
        E.left(
          new ItemAlreadyExists(
            `The item already exists; original error body: ${error.body}`,
          ),
        ),
      );
    });
  });

  describe('activate', () => {
    it('should not perform the update when there are no elements to update', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'success' as const;

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).activate(anActivationJob, [])();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenCalledTimes(0);
    });
    it('should succeed when all the elements have been updated', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'success' as const;
      const { operationChunks, activationRequests } = makeTestData(1);
      // Construct success response for every item in activationRequests
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockBatchResponse = [...activationRequests].map((_) => ({
        statusCode: 200,
      }));
      mockDB
        .container('')
        .items.batch.mockResolvedValueOnce({ result: mockBatchResponse });

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).activate(anActivationJob, activationRequests)();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operationChunks[0],
        anActivationJob.trialId,
      );
    });
    it('should return a success and a fail when a batch fails', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'fail' as const;
      const { operationChunks, activationRequests } = makeTestData(100);

      const mockBatchResponse = [...activationRequests].map((_) =>
        _.id !== '99'
          ? {
              statusCode: 200,
            }
          : { statusCode: 429 },
      );
      const mockBatchResponseChunks = RA.chunksOf(99)(mockBatchResponse);

      mockDB.container('').items.batch.mockResolvedValueOnce({
        result: mockBatchResponseChunks[0],
      });
      mockDB.container('').items.batch.mockResolvedValueOnce({
        result: mockBatchResponseChunks[1],
      });

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).activate(anActivationJob, activationRequests)();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenCalledTimes(
        operationChunks.length,
      );
      expect(mockDB.container('').items.batch).toHaveBeenCalledWith(
        operationChunks[0],
        anActivationJob.trialId,
      );
      expect(mockDB.container('').items.batch).toHaveBeenCalledWith(
        operationChunks[1],
        anActivationJob.trialId,
      );
    });
    it('should fail when the update failed', async () => {
      const mockDB = makeDatabaseMock();
      const { operationChunks, activationRequests } = makeTestData(1);
      const error = new Error('Something went wrong');
      mockDB.container('').items.batch.mockRejectedValueOnce(error);

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).activate(anActivationJob, activationRequests)();

      expect(actual).toStrictEqual(E.left(error));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operationChunks[0],
        anActivationJob.trialId,
      );
    });
    it('should return fail when there was not possible to perform the update', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'fail' as const;
      const { operationChunks, activationRequests } = makeTestData(1);
      // Construct success response for every item in activationRequests
      const mockBatchResponse = [...activationRequests].map(() => ({
        statusCode: 429,
      }));
      mockDB
        .container('')
        .items.batch.mockResolvedValueOnce({ result: mockBatchResponse });

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).activate(anActivationJob, activationRequests)();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operationChunks[0],
        anActivationJob.trialId,
      );
    });
  });

  describe('list', () => {
    const elementsToFetch = 10;
    it('should return list of activation requests', async () => {
      const mockDB = makeDatabaseMock();

      const activationRequests = [anActivationRequest];

      mockDB.container('').items.query.mockReturnValueOnce({
        fetchAll: () => Promise.resolve({ resources: activationRequests }),
      });

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).list(anActivationJob.trialId, elementsToFetch)();

      expect(actual).toStrictEqual(E.right(activationRequests));
      expect(mockDB.container('').items.query).toHaveBeenCalledTimes(1);
    });
    it('should return an empty array when no items match the query', async () => {
      const mockDB = makeDatabaseMock();

      mockDB.container('').items.query.mockReturnValueOnce({
        fetchAll: () => Promise.resolve({ resources: [] }),
      });

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).list(anActivationJob.trialId, elementsToFetch)();

      expect(actual).toStrictEqual(E.right([]));
      expect(mockDB.container('').items.query).toHaveBeenCalledTimes(1);
    });
    it('should return an error when query fail', async () => {
      const mockDB = makeDatabaseMock();
      const error = new Error('Something went wrong');
      mockDB.container('').items.query.mockReturnValueOnce({
        // eslint-disable-next-line functional/no-promise-reject
        fetchAll: () => Promise.reject(error),
      });

      const actual = await makeActivationRequestReaderWriter(
        mockDB as unknown as Database,
      ).list(anActivationJob.trialId, elementsToFetch)();

      expect(actual).toStrictEqual(E.left(error));
      expect(mockDB.container('').items.query).toHaveBeenCalledTimes(1);
    });
  });
});

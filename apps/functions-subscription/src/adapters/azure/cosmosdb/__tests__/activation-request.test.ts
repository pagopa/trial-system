import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { Database } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import {
  anActivationJob,
  anActivationRequest,
} from '../../../../domain/__tests__/data';
import { makeActivationRequestRepository } from '../activation-request';

describe('makeActivationCosmosContainer', () => {
  describe('activateActivationRequests', () => {
    const operations = [
      {
        operationType: 'Patch',
        id: anActivationRequest.id,
        ifMatch: anActivationRequest._etag,
        resourceBody: {
          operations: [
            {
              op: 'replace',
              path: '/activated',
              value: true,
            },
          ],
        },
      },
      {
        operationType: 'Patch',
        id: anActivationJob.id,
        resourceBody: {
          operations: [
            {
              op: 'incr',
              path: '/usersActivated',
              value: 1,
            },
          ],
        },
      },
    ];
    it('should not perform the update when there are no elements to update', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'success' as const;

      const actual = await makeActivationRequestRepository(
        mockDB as unknown as Database,
      ).activate(anActivationJob, anActivationJob.trialId, [])();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenCalledTimes(0);
    });
    it('should succeed when all the elements have been updated', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'success' as const;
      const activationRequests = [anActivationRequest];
      // Construct success response for every item in activationRequests
      const mockBatchResponse = [...activationRequests].map(() => ({
        statusCode: 200,
      }));
      mockDB
        .container('')
        .items.batch.mockResolvedValueOnce({ result: mockBatchResponse });

      const actual = await makeActivationRequestRepository(
        mockDB as unknown as Database,
      ).activate(
        anActivationJob,
        anActivationJob.trialId,
        activationRequests,
      )();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJob.trialId,
      );
    });
    it('should fail when the update failed', async () => {
      const mockDB = makeDatabaseMock();
      const activationRequests = [anActivationRequest];
      const error = new Error('Something went wrong');
      mockDB.container('').items.batch.mockRejectedValueOnce(error);

      const actual = await makeActivationRequestRepository(
        mockDB as unknown as Database,
      ).activate(
        anActivationJob,
        anActivationJob.trialId,
        activationRequests,
      )();

      expect(actual).toStrictEqual(E.left(error));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJob.trialId,
      );
    });
    it('should return fail when there was not possible to perform the update', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'fail' as const;
      const activationRequests = [anActivationRequest];
      // Construct success response for every item in activationRequests
      const mockBatchResponse = [...activationRequests].map(() => ({
        statusCode: 429,
      }));
      mockDB
        .container('')
        .items.batch.mockResolvedValueOnce({ result: mockBatchResponse });

      const actual = await makeActivationRequestRepository(
        mockDB as unknown as Database,
      ).activate(
        anActivationJob,
        anActivationJob.trialId,
        activationRequests,
      )();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJob.trialId,
      );
    });
  });

  describe('fetchActivationRequestItemsToActivate', () => {
    const elementsToFetch = 10;
    it('should return list of activation requests', async () => {
      const mockDB = makeDatabaseMock();

      const activationRequests = [anActivationRequest];

      mockDB.container('').items.query.mockReturnValueOnce({
        fetchAll: () => Promise.resolve({ resources: activationRequests }),
      });

      const actual = await makeActivationRequestRepository(
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

      const actual = await makeActivationRequestRepository(
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

      const actual = await makeActivationRequestRepository(
        mockDB as unknown as Database,
      ).list(anActivationJob.trialId, elementsToFetch)();

      expect(actual).toStrictEqual(E.left(error));
      expect(mockDB.container('').items.query).toHaveBeenCalledTimes(1);
    });
  });
});

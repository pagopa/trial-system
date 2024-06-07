import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { Database } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import {
  anActivationJobItem,
  anActivationRequestItem,
} from '../../../../domain/__tests__/data';
import { makeActivationCosmosContainer } from '../activation';

describe('makeActivationCosmosContainer', () => {
  describe('activateActivationRequests', () => {
    it('should not perform the update when there are no elements to update', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'not-executed' as const;

      const actual = await makeActivationCosmosContainer(
        mockDB as unknown as Database,
      ).activateRequestItems(anActivationJobItem)([])();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenCalledTimes(0);
    });
    it('should succeed when all the elements have been updated', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'success' as const;
      const activationRequests = [anActivationRequestItem];
      // Construct success response for every item in activationRequests
      const mockBatchResponse = [...activationRequests].map(() => ({
        statusCode: 200,
      }));
      mockDB
        .container('')
        .items.batch.mockResolvedValueOnce({ result: mockBatchResponse });

      const actual = await makeActivationCosmosContainer(
        mockDB as unknown as Database,
      ).activateRequestItems(anActivationJobItem)(activationRequests)();

      const operations = [
        {
          operationType: 'Patch',
          id: anActivationRequestItem.id,
          ifMatch: anActivationRequestItem._etag,
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
          id: anActivationJobItem.id,
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

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJobItem.trialId,
      );
    });
    it('should fail when the update failed', async () => {
      const mockDB = makeDatabaseMock();
      const activationRequests = [anActivationRequestItem];
      const error = new Error('Something went wrong');
      mockDB.container('').items.batch.mockRejectedValueOnce(error);

      const actual = await makeActivationCosmosContainer(
        mockDB as unknown as Database,
      ).activateRequestItems(anActivationJobItem)(activationRequests)();

      const operations = [
        {
          operationType: 'Patch',
          id: anActivationRequestItem.id,
          ifMatch: anActivationRequestItem._etag,
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
          id: anActivationJobItem.id,
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

      expect(actual).toStrictEqual(E.left(error));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJobItem.trialId,
      );
    });
    it('should return fail when there was not possible to perform the update', async () => {
      const mockDB = makeDatabaseMock();
      const result = 'fail' as const;
      const activationRequests = [anActivationRequestItem];
      // Construct success response for every item in activationRequests
      const mockBatchResponse = [...activationRequests].map(() => ({
        statusCode: 429,
      }));
      mockDB
        .container('')
        .items.batch.mockResolvedValueOnce({ result: mockBatchResponse });

      const actual = await makeActivationCosmosContainer(
        mockDB as unknown as Database,
      ).activateRequestItems(anActivationJobItem)(activationRequests)();

      const operations = [
        {
          operationType: 'Patch',
          id: anActivationRequestItem.id,
          ifMatch: anActivationRequestItem._etag,
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
          id: anActivationJobItem.id,
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

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJobItem.trialId,
      );
    });
  });
});

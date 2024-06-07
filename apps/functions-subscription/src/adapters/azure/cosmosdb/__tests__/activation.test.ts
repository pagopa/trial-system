import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { Database } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import {
  anActivationJob,
  anActivationRequest,
} from '../../../../domain/__tests__/data';
import { makeActivationCosmosContainer } from '../activation';

describe('makeActivationCosmosContainer', () => {
  describe('activateActivationRequests', () => {
    it('should not perform the update when there are no elements to update', async () => {
      const mockDB = makeDatabaseMock();
      const result = {
        activated: 0,
        status: 'ok',
      };

      const actual = await makeActivationCosmosContainer(
        mockDB as unknown as Database,
      ).activateActivationRequests(anActivationJob)([])();

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenCalledTimes(0);
    });
    it('should return the counter of the updated elements', async () => {
      const mockDB = makeDatabaseMock();
      const result = {
        activated: 1,
        status: 'ok',
      };
      const activationRequests = [anActivationRequest];
      mockDB.container('').items.batch.mockResolvedValueOnce({});

      const actual = await makeActivationCosmosContainer(
        mockDB as unknown as Database,
      ).activateActivationRequests(anActivationJob)(activationRequests)();

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

      expect(actual).toStrictEqual(E.right(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJob.trialId,
      );
    });
    it('should return ko when the update failed', async () => {
      const mockDB = makeDatabaseMock();
      const result = {
        activated: 0,
        status: 'ko',
      };
      const activationRequests = [anActivationRequest];
      mockDB
        .container('')
        .items.batch.mockRejectedValueOnce(new Error('Something went wrong'));

      const actual = await makeActivationCosmosContainer(
        mockDB as unknown as Database,
      ).activateActivationRequests(anActivationJob)(activationRequests)();

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

      expect(actual).toStrictEqual(E.left(result));
      expect(mockDB.container('').items.batch).toHaveBeenNthCalledWith(
        1,
        operations,
        anActivationJob.trialId,
      );
    });
  });
});

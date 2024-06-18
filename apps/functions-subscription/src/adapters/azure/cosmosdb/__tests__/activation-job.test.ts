import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { Database } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import { anActivationJob } from '../../../../domain/__tests__/data';
import { makeActivationJobCosmosContainer } from '../activation-job';

describe('makeActivationJobCosmosContainer', () => {
  describe('get', () => {
    it('should get the item', async () => {
      const mockDB = makeDatabaseMock();
      const testDB = mockDB as unknown as Database;

      mockDB.container('').item.mockReturnValueOnce({
        read: () => Promise.resolve({ resource: anActivationJob }),
      });

      const { id, trialId } = anActivationJob;

      const actual = await makeActivationJobCosmosContainer(testDB).get(
        id,
        trialId,
      )();

      expect(actual).toStrictEqual(E.right(O.some(anActivationJob)));
      expect(mockDB.container('').item).toBeCalledWith(id, trialId);
    });
  });

  describe('insert', () => {
    it('should insert the item without error', async () => {
      const mockDB = makeDatabaseMock();
      const testDB = mockDB as unknown as Database;

      mockDB
        .container('')
        .items.create.mockResolvedValueOnce({ body: anActivationJob });

      const actual =
        await makeActivationJobCosmosContainer(testDB).insert(
          anActivationJob,
        )();

      expect(actual).toStrictEqual(E.right(anActivationJob));
      expect(mockDB.container('').items.create).toBeCalledWith(anActivationJob);
    });
  });
});

import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { Database } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import { anActivationJob } from '../../../../domain/__tests__/data';
import { makeActivationJobCosmosContainer } from '../activation-job';

describe('makeActivationJobCosmosContainer', () => {
  describe('insert', () => {
    it('should insert the item witout error', async () => {
      const mockDB = makeDatabaseMock();
      const testDB = mockDB as unknown as Database;
      const id = anActivationJob.trialId;

      mockDB
        .container('')
        .items.create.mockResolvedValueOnce({ body: anActivationJob });

      const actual =
        await makeActivationJobCosmosContainer(testDB).insert(
          anActivationJob,
        )();

      expect(actual).toStrictEqual(E.right(anActivationJob));
      expect(mockDB.container('').items.create).toBeCalledWith({
        ...anActivationJob,
        id,
      });
    });
  });
});

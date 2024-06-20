import { describe, expect, it, vi } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { Database, ErrorResponse } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import { anActivationJob } from '../../../../domain/__tests__/data';
import { makeActivationJobCosmosContainer } from '../activation-job';
import { ItemNotFound } from '../../../../domain/errors';

describe('makeActivationJobCosmosContainer', () => {
  describe('get', () => {
    it('should get the item', async () => {
      const mockDB = makeDatabaseMock();
      const testDB = mockDB as unknown as Database;

      mockDB.container('').item.mockReturnValueOnce({
        read: () => Promise.resolve({ resource: anActivationJob }),
      });

      const { trialId: id } = anActivationJob;

      const actual = await makeActivationJobCosmosContainer(testDB).get(id)();

      expect(actual).toStrictEqual(E.right(O.some(anActivationJob)));
      expect(mockDB.container('').item).toBeCalledWith(id, id);
    });
  });

  describe('insert', () => {
    it('should insert the item without error', async () => {
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
  describe('update', () => {
    it('should call patch as expected', async () => {
      const mockDB = makeDatabaseMock();
      const testDB = mockDB as unknown as Database;
      const patchMock = vi.fn();
      const { trialId, usersToActivate } = anActivationJob;
      const update = { usersToActivate };

      mockDB.container('').item.mockReturnValueOnce({ patch: patchMock });
      patchMock.mockResolvedValueOnce({ resource: anActivationJob });

      const actual = await makeActivationJobCosmosContainer(testDB).update(
        trialId,
        update,
      )();

      expect(actual).toStrictEqual(E.right(anActivationJob));
      expect(mockDB.container('').item).toBeCalledWith(trialId, trialId);
      expect(patchMock).toBeCalledWith([
        {
          op: 'replace',
          path: '/usersToActivate',
          value: usersToActivate,
        },
      ]);
    });

    it('should return ItemNotFound if patch returns 404', async () => {
      const mockDB = makeDatabaseMock();
      const testDB = mockDB as unknown as Database;
      const patchMock = vi.fn();
      const { trialId, usersToActivate } = anActivationJob;
      const update = { usersToActivate };
      const error = new ErrorResponse();
      // eslint-disable-next-line functional/immutable-data
      error.code = 404;

      mockDB.container('').item.mockReturnValueOnce({ patch: patchMock });
      patchMock.mockRejectedValueOnce(error);

      const actual = await makeActivationJobCosmosContainer(testDB).update(
        trialId,
        update,
      )();

      expect(actual).toStrictEqual(
        E.left(
          new ItemNotFound(
            `The item was not found; original error body: ${error.body}`,
          ),
        ),
      );
    });
  });
});

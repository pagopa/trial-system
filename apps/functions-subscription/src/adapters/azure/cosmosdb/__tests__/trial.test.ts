import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { Database, ErrorResponse } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import { aTrial } from '../../../../domain/__tests__/data';
import { ItemAlreadyExists } from '../../../../domain/errors';
import { makeTrialsCosmosContainer } from '../trial';

describe('makeTrialsCosmosContainer', () => {
  describe('insert', () => {
    it('should insert the item if does not already exist', async () => {
      const mockDB = makeDatabaseMock();

      mockDB
        .container('')
        .items.create.mockReturnValueOnce(Promise.resolve({ body: aTrial }));

      const actual = await makeTrialsCosmosContainer(
        mockDB as unknown as Database,
      ).insert(aTrial)();

      expect(actual).toStrictEqual(E.right(aTrial));
      expect(mockDB.container('').items.create).toBeCalledWith(aTrial);
    });

    it('should return ItemAlreadyExists if the item already exists', async () => {
      const mockDB = makeDatabaseMock();
      const error = new ErrorResponse('');
      // eslint-disable-next-line functional/immutable-data
      error.code = 409;

      mockDB.container('').items.create.mockRejectedValueOnce(error);

      const actual = await makeTrialsCosmosContainer(
        mockDB as unknown as Database,
      ).insert(aTrial)();

      expect(actual).toMatchObject(
        E.left(
          new ItemAlreadyExists(
            `The item already exists; original error body: ${error.body}`,
          ),
        ),
      );
      expect(mockDB.container('').items.create).toBeCalledWith(aTrial);
    });
  });
});

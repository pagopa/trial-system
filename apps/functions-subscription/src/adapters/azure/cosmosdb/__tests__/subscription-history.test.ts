import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { Database, ErrorResponse } from '@azure/cosmos';
import { makeDatabaseMock } from './mocks';
import { aSubscriptionHistory } from '../../../../domain/__tests__/data';
import { makeSubscriptionHistoryCosmosContainer } from '../subscription-history';
import { ItemAlreadyExists } from '../../../../domain/errors';

describe('makeSubscriptionHistoryCosmosContainer', () => {
  it('should insert the item if does not already exist', async () => {
    const mockDB = makeDatabaseMock();
    const testDB = mockDB as unknown as Database;

    mockDB
      .container('')
      .items.create.mockReturnValueOnce(
        Promise.resolve({ body: aSubscriptionHistory }),
      );

    const actual =
      await makeSubscriptionHistoryCosmosContainer(testDB).insert(
        aSubscriptionHistory,
      )();

    expect(actual).toStrictEqual(E.right(aSubscriptionHistory));
    expect(mockDB.container('').items.create).toBeCalledWith(
      aSubscriptionHistory,
    );
  });

  it('should return ItemAlreadyExists if the item already exists', async () => {
    const mockDB = makeDatabaseMock();
    const testDB = mockDB as unknown as Database;
    const error = new ErrorResponse('');
    // eslint-disable-next-line functional/immutable-data
    error.code = 409;

    mockDB.container('').items.create.mockRejectedValueOnce(error);

    const actual =
      await makeSubscriptionHistoryCosmosContainer(testDB).insert(
        aSubscriptionHistory,
      )();

    expect(actual).toMatchObject(
      E.left(
        new ItemAlreadyExists(
          `The item already exists; original error body: ${error.body}`,
        ),
      ),
    );
    expect(mockDB.container('').items.create).toBeCalledWith(
      aSubscriptionHistory,
    );
  });
});

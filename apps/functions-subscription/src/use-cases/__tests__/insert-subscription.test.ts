import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { insertSubscription } from '../insert-subscription';
import {
  aSubscription,
  aSubscriptionHistory,
  aSubscriptionRequest,
} from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { SubscriptionStoreError } from '../errors';
import { ItemAlreadyExists } from '../../domain/errors';

const { userId, trialId } = aSubscription;

describe('insertSubscription', () => {
  it('should return error if the subscription already exists', async () => {
    const testEnv = makeTestEnv();

    testEnv.subscriptionReader.get.mockReturnValueOnce(
      TE.right(O.some(aSubscription)),
    );
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.left(
      new ItemAlreadyExists('Subscription already exists'),
    );
    expect(actual).toStrictEqual(expected);
  });

  it('should return the subscription created', async () => {
    const testEnv = makeTestEnv();

    testEnv.clock.now.mockReturnValue(aSubscription.createdAt);
    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.right(aSubscription),
    );
    testEnv.subscriptionRequestWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionRequest),
    );

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.right(aSubscription);

    expect(actual).toMatchObject(expected);
    expect(testEnv.subscriptionWriter.insert).toBeCalledWith(aSubscription);
    expect(testEnv.subscriptionRequestWriter.insert).toBeCalledWith(
      aSubscriptionRequest,
    );
    expect(
      testEnv.subscriptionRequestWriter.insert.mock.invocationCallOrder[0],
    ).toBeLessThan(
      testEnv.subscriptionWriter.insert.mock.invocationCallOrder[0],
    );
  });

  it('should return the subscription created with ACTIVE state', async () => {
    const testEnv = makeTestEnv();

    const anActiveSubscriptionHistoryV0 = {
      ...aSubscriptionHistory,
      state: 'ACTIVE' as const,
    };

    testEnv.clock.now.mockReturnValue(aSubscription.createdAt);
    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistory.id });
    testEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right(anActiveSubscriptionHistoryV0),
    );

    const actual = await insertSubscription(
      userId,
      trialId,
      anActiveSubscriptionHistoryV0.state,
    )(testEnv)();
    const expected = E.right({
      ...aSubscription,
      state: anActiveSubscriptionHistoryV0.state,
    });

    expect(actual).toMatchObject(expected);
    expect(testEnv.subscriptionHistoryWriter.insert).toBeCalledWith(
      anActiveSubscriptionHistoryV0,
    );
    expect(testEnv.subscriptionRequestWriter.insert).not.toHaveBeenCalled();
  });

  it('should return SubscriptionStoreError if item insertion fails but request insertion succeeds', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionWriter.insert.mockReturnValueOnce(TE.left(error));
    testEnv.subscriptionRequestWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionRequest),
    );

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.left(new SubscriptionStoreError());
    expect(actual).toMatchObject(expected);
    expect(
      testEnv.subscriptionRequestWriter.insert.mock.invocationCallOrder[0],
    ).toBeLessThan(
      testEnv.subscriptionWriter.insert.mock.invocationCallOrder[0],
    );
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.left(error));
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

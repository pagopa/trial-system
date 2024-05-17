import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { insertSubscription } from '../insert-subscription';
import {
  aSubscription,
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
    testEnv.subscriptionWriter.insert.mockImplementationOnce((_) =>
      TE.right(_),
    );
    testEnv.subscriptionRequestWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionRequest),
    );

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.right(aSubscription);
    expect(actual).toMatchObject(expected);
  });

  it('should return AsyncProcessing', async () => {
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

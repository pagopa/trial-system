import { describe, expect, it } from 'vitest';
import * as IO from 'fp-ts/IO';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { insertSubscription } from '../insert-subscription';
import {
  aSubscription,
  aSubscriptionRequest,
} from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { SubscriptionAlreadyExists } from '../errors';

describe('insertSubscription', () => {
  it('should return error if the subscription already exists', async () => {
    const { userId, trialId } = aSubscription;
    const testEnv = makeTestEnv();

    testEnv.subscriptionReader.get.mockReturnValueOnce(
      TE.right(O.some(aSubscription)),
    );
    testEnv.hashFn.mockReturnValueOnce(IO.of(aSubscription.id));

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.left(
      new SubscriptionAlreadyExists('Subscription already exists'),
    );
    expect(actual).toStrictEqual(expected);
  });

  it('should return the subscription created', async () => {
    const { userId, trialId } = aSubscription;
    const testEnv = makeTestEnv();

    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn.mockReturnValueOnce(IO.of(aSubscription.id));
    testEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.right(aSubscription),
    );
    testEnv.subscriptionRequestWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionRequest),
    );

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.right(aSubscription);
    expect(actual).toMatchObject(expected);
  });

  it('should return AsyncProcessing', async () => {
    const { userId, trialId } = aSubscription;
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn.mockReturnValueOnce(IO.of(aSubscription.id));
    testEnv.subscriptionWriter.insert.mockReturnValueOnce(TE.left(error));
    testEnv.subscriptionRequestWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionRequest),
    );

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
    expect(
      testEnv.subscriptionRequestWriter.insert.mock.invocationCallOrder[0],
    ).toBeLessThan(
      testEnv.subscriptionWriter.insert.mock.invocationCallOrder[0],
    );
  });

  it('should return error if something fail', async () => {
    const { userId, trialId } = aSubscription;
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.left(error));
    testEnv.hashFn.mockReturnValueOnce(IO.of(aSubscription.id));

    const actual = await insertSubscription(userId, trialId)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

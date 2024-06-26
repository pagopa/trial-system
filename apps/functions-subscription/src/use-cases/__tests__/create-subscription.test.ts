import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { aSubscription } from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { SubscriptionStoreError } from '../errors';
import { ItemAlreadyExists } from '../../domain/errors';
import { createSubscription } from '../create-subscription';

const { userId, trialId } = aSubscription;

describe('createSubscription', () => {
  it('should return ItemAlreadyExists if the subscription already exists', async () => {
    const env = makeTestEnv();
    const error = new ItemAlreadyExists('Subscription already exists');

    env.subscriptionReader.get.mockReturnValueOnce(
      TE.right(O.some(aSubscription)),
    );
    env.hashFn.mockReturnValueOnce({ value: aSubscription.id });

    const actual = await createSubscription(userId, trialId)(env)();

    expect(actual).toStrictEqual(E.left(error));
  });

  it('should return the subscription created', async () => {
    const testEnv = makeTestEnv();

    testEnv.clock.now.mockReturnValue(aSubscription.createdAt);
    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.right(aSubscription),
    );
    testEnv.subscriptionQueue.enqueue.mockReturnValueOnce(
      TE.right(aSubscription),
    );

    const actual = await createSubscription(userId, trialId)(testEnv)();
    const expected = E.right(aSubscription);

    expect(actual).toMatchObject(expected);
    expect(testEnv.subscriptionWriter.insert).toBeCalledWith(aSubscription);
    expect(testEnv.subscriptionQueue.enqueue).toBeCalledWith(aSubscription);
    expect(
      testEnv.subscriptionQueue.enqueue.mock.invocationCallOrder[0],
    ).toBeLessThan(
      testEnv.subscriptionWriter.insert.mock.invocationCallOrder[0],
    );
  });

  it('should return the subscription created with ACTIVE state', async () => {
    const testEnv = makeTestEnv();

    const anActiveSubscription = {
      ...aSubscription,
      state: 'ACTIVE' as const,
    };

    testEnv.clock.now.mockReturnValue(anActiveSubscription.createdAt);
    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn.mockReturnValueOnce({ value: anActiveSubscription.id });
    testEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.right(anActiveSubscription),
    );
    testEnv.subscriptionQueue.enqueue.mockReturnValueOnce(
      TE.right(anActiveSubscription),
    );

    const actual = await createSubscription(
      userId,
      trialId,
      'ACTIVE',
    )(testEnv)();
    const expected = E.right({ ...aSubscription, state: 'ACTIVE' });

    expect(actual).toMatchObject(expected);
    expect(testEnv.subscriptionWriter.insert).toBeCalledWith(
      anActiveSubscription,
    );
  });

  it('should return SubscriptionStoreError if item insertion fails but request insertion succeeds', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionWriter.insert.mockReturnValueOnce(TE.left(error));
    testEnv.subscriptionQueue.enqueue.mockReturnValueOnce(
      TE.right(aSubscription),
    );

    const actual = await createSubscription(userId, trialId)(testEnv)();
    const expected = E.left(new SubscriptionStoreError());
    expect(actual).toMatchObject(expected);
    expect(
      testEnv.subscriptionQueue.enqueue.mock.invocationCallOrder[0],
    ).toBeLessThan(
      testEnv.subscriptionWriter.insert.mock.invocationCallOrder[0],
    );
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.left(error));
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });

    const actual = await createSubscription(userId, trialId)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import {
  aSubscription,
  aTrial,
  aTrialOwner,
  aTrialSubscriber,
} from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { getSubscription } from '../get-subscription';
import { ItemNotFound } from '../../domain/errors';

const { userId, trialId } = aSubscription;

describe('getSubscription', () => {
  it('should return the subscription', async () => {
    const testEnv = makeTestEnv();

    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionReader.get.mockReturnValueOnce(
      TE.right(O.some(aSubscription)),
    );

    const actual = await getSubscription(
      aTrialSubscriber,
      userId,
      trialId,
    )(testEnv)();
    const expected = E.right(aSubscription);

    expect(actual).toMatchObject(expected);
  });

  it('should return the subscription when trial owner make request', async () => {
    const testEnv = makeTestEnv();

    testEnv.trialReader.getByIdAndOwnerId.mockReturnValueOnce(
      TE.of(O.some(aTrial)),
    );
    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionReader.get.mockReturnValueOnce(
      TE.right(O.some(aSubscription)),
    );

    const actual = await getSubscription(
      aTrialOwner,
      userId,
      trialId,
    )(testEnv)();
    const expected = E.right(aSubscription);

    expect(actual).toMatchObject(expected);
  });

  it('should return ItemNotFound when the subscription does not exist', async () => {
    const testEnv = makeTestEnv();
    const notFoundError = new ItemNotFound('Subscription not found');

    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.right(O.none));

    const actual = await getSubscription(
      aTrialSubscriber,
      userId,
      trialId,
    )(testEnv)();
    const expected = E.left(notFoundError);
    expect(actual).toStrictEqual(expected);
  });

  it('should return ItemNotFound when the trial does not exist', async () => {
    const testEnv = makeTestEnv();
    const notFoundError = new ItemNotFound('Subscription not found');

    testEnv.trialReader.getByIdAndOwnerId.mockReturnValueOnce(TE.right(O.none));

    const actual = await getSubscription(
      aTrialOwner,
      userId,
      trialId,
    )(testEnv)();
    const expected = E.left(notFoundError);
    expect(actual).toStrictEqual(expected);
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    testEnv.subscriptionReader.get.mockReturnValueOnce(TE.left(error));

    const actual = await getSubscription(
      aTrialSubscriber,
      userId,
      trialId,
    )(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

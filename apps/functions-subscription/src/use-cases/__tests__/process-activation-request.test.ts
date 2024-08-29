import { describe, expect, it } from 'vitest';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { Capabilities } from '../../domain/capabilities';
import { processActivationRequest } from '../process-activation-request';
import {
  aSubscription,
  aSubscriptionHistory,
  aSubscriptionHistoryV1,
  anActivationRequestActivated,
} from '../../domain/__tests__/data';

describe('processActivationRequest', () => {
  it('should not insert a new version when state does not change', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.hashFn.mockReturnValueOnce({
      value: aSubscriptionHistoryV1.subscriptionId,
    });
    mockEnv.subscriptionHistoryReader.getLatest.mockReturnValueOnce(
      TE.right(O.some(aSubscriptionHistoryV1)),
    );

    const actual = await processActivationRequest(anActivationRequestActivated)(
      testEnv,
    )();

    expect(actual).toStrictEqual(E.right(O.some(aSubscriptionHistoryV1)));
    expect(mockEnv.subscriptionHistoryReader.getLatest).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(0);
  });

  it('should create a new version of subscription-history when state changed', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.clock.now.mockReturnValueOnce(aSubscriptionHistoryV1.updatedAt);
    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistoryV1.id });
    mockEnv.subscriptionHistoryReader.getLatest.mockReturnValueOnce(
      TE.right(O.some(aSubscriptionHistory)),
    );
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionHistoryV1),
    );

    const actual = await processActivationRequest(anActivationRequestActivated)(
      testEnv,
    )();

    expect(actual).toStrictEqual(E.right(O.some(aSubscriptionHistoryV1)));
    expect(mockEnv.subscriptionHistoryReader.getLatest).toBeCalledWith({
      subscriptionId: aSubscription.id,
    });
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledWith(
      aSubscriptionHistoryV1,
    );
  });

  it('should fail if subscription does not exist', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.hashFn.mockReturnValueOnce({ value: aSubscription.id });
    mockEnv.subscriptionHistoryReader.getLatest.mockReturnValueOnce(
      TE.right(O.none),
    );

    const actual = await processActivationRequest(anActivationRequestActivated)(
      testEnv,
    )();
    const expected = E.left(new Error('Subscription History not found'));

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.subscriptionHistoryReader.getLatest).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(0);
  });

  it('should fail if insert subscription raise an error', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;
    const error = new Error('Oh No!');

    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistoryV1.id });
    mockEnv.subscriptionHistoryReader.getLatest.mockReturnValueOnce(
      TE.right(O.some(aSubscriptionHistory)),
    );
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.left(error),
    );

    const actual = await processActivationRequest(anActivationRequestActivated)(
      testEnv,
    )();

    expect(actual).toStrictEqual(E.left(error));
  });

  it('should fail if get latest subscription history raise an error', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;
    const error = new Error('Oh No!');

    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistoryV1.id });
    mockEnv.subscriptionHistoryReader.getLatest.mockReturnValueOnce(
      TE.left(error),
    );

    const actual = await processActivationRequest(anActivationRequestActivated)(
      testEnv,
    )();

    expect(actual).toStrictEqual(E.left(error));
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(0);
  });
});

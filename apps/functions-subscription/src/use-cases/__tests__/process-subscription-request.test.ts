import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { processSubscriptionRequest } from '../process-subscription-request';
import {
  aSubscription,
  aSubscriptionHistory,
  anActivationRequest,
  anInsertActivationRequest,
} from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { Capabilities } from '../../domain/capabilities';
import { ItemAlreadyExists } from '../../domain/errors';

const { userId, trialId } = aSubscription;

describe('processSubscriptionRequest', () => {
  it('should call insert subscription-history and activation request if the subscription request is SUBSCRIBED', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicIdFn.mockReturnValueOnce({
      value: anActivationRequest.id,
    });
    mockEnv.clock.now.mockReturnValueOnce(aSubscription.createdAt);
    mockEnv.hashFn.mockReturnValueOnce({ value: aSubscriptionHistory.id });
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionHistory),
    );
    mockEnv.activationRequestWriter.insert.mockReturnValueOnce(
      TE.right(anActivationRequest),
    );

    const actual = await processSubscriptionRequest(aSubscription)(testEnv)();

    expect(actual).toStrictEqual(E.right({ userId, trialId }));
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(0);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledWith(
      aSubscriptionHistory,
    );
    expect(mockEnv.activationRequestWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestWriter.insert).toBeCalledWith(
      anInsertActivationRequest,
    );
  });
  it('should call activate if the subscription request is ACTIVE', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicIdFn.mockReturnValueOnce({
      value: anActivationRequest.id,
    });
    mockEnv.clock.now.mockReturnValueOnce(aSubscription.createdAt);
    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistory.id });
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right({ ...aSubscriptionHistory, state: 'ACTIVE' }),
    );
    mockEnv.activationRequestWriter.insert.mockReturnValueOnce(
      TE.right({ ...anActivationRequest, state: 'ACTIVE' }),
    );
    mockEnv.activationRequestWriter.updateActivationRequestsState.mockReturnValueOnce(
      TE.right('success'),
    );

    const actual = await processSubscriptionRequest({
      ...aSubscription,
      state: 'ACTIVE',
    })(testEnv)();

    expect(actual).toStrictEqual(E.right({ userId, trialId }));
    expect(
      mockEnv.activationRequestWriter.updateActivationRequestsState,
    ).toBeCalledWith([{ ...anActivationRequest, state: 'ACTIVE' }], 'ACTIVE');
  });
  it('should not call activate if the request is neither ACTIVE nor SUBSCRIBED', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicIdFn.mockReturnValueOnce({
      value: anActivationRequest.id,
    });
    mockEnv.clock.now.mockReturnValueOnce(aSubscription.createdAt);
    mockEnv.hashFn.mockReturnValueOnce({ value: aSubscriptionHistory.id });
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionHistory),
    );

    const actual = await processSubscriptionRequest({
      ...aSubscription,
      state: 'DISABLED',
    })(testEnv)();

    expect(actual).toStrictEqual(E.right({ userId, trialId }));
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(0);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestWriter.insert).toBeCalledTimes(0);
  });
  it('should insert the first version of subscription-history if subscription already exists', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicIdFn.mockReturnValueOnce({
      value: anActivationRequest.id,
    });
    mockEnv.clock.now.mockReturnValueOnce(aSubscription.createdAt);
    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistory.id });
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionHistory),
    );
    mockEnv.activationRequestWriter.insert.mockReturnValueOnce(
      TE.right(anActivationRequest),
    );

    const actual = await processSubscriptionRequest(aSubscription)(testEnv)();

    expect(actual).toStrictEqual(E.right({ userId, trialId }));
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(0);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestWriter.insert).toBeCalledTimes(1);
  });
  it('should insert the subscription if first version of subscription-history already exists', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicIdFn.mockReturnValueOnce({
      value: anActivationRequest.id,
    });
    mockEnv.clock.now.mockReturnValueOnce(aSubscription.createdAt);
    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistory.id });
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );
    mockEnv.activationRequestWriter.insert.mockReturnValueOnce(
      TE.right(anActivationRequest),
    );

    const actual = await processSubscriptionRequest(aSubscription)(testEnv)();

    expect(actual).toStrictEqual(E.right({ userId, trialId }));
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(0);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestWriter.insert).toBeCalledTimes(1);
  });
  it('should succeed if the first version of subscription-history, subscription and activation already exists', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicIdFn.mockReturnValueOnce({
      value: anActivationRequest.id,
    });
    mockEnv.clock.now.mockReturnValueOnce(aSubscription.createdAt);
    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistory.id });
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );
    mockEnv.activationRequestWriter.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );

    const actual = await processSubscriptionRequest(aSubscription)(testEnv)();

    expect(actual).toStrictEqual(E.right({ userId, trialId }));
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(0);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestWriter.insert).toBeCalledTimes(1);
  });
  it('should fail if an unexpected error is raised', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;
    const unexpectedError = new Error('Unexpected error');

    mockEnv.monotonicIdFn.mockReturnValueOnce({
      value: anActivationRequest.id,
    });
    mockEnv.clock.now.mockReturnValueOnce(aSubscription.createdAt);
    mockEnv.hashFn
      .mockReturnValueOnce({ value: aSubscription.id })
      .mockReturnValueOnce({ value: aSubscriptionHistory.id });
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.left(unexpectedError),
    );

    const actual = await processSubscriptionRequest(aSubscription)(testEnv)();
    const expected = E.left(unexpectedError);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(0);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestWriter.insert).not.toHaveBeenCalled();
  });
});

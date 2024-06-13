import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { processSubscriptionRequest } from '../process-subscription-request';
import {
  aSubscriptionRequest,
  aSubscription,
  aSubscriptionHistory,
  anActivationRequest,
  aMonotonicId,
} from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { Capabilities } from '../../domain/capabilities';
import { ItemAlreadyExists } from '../../domain/errors';

describe('processSubscriptionRequest', () => {
  it('should insert the first version of subscription-history, subscription and activation', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicId.mockReturnValueOnce(aMonotonicId);
    mockEnv.clock.now.mockReturnValueOnce(TE.right(aSubscription.createdAt));
    mockEnv.hashFn
      .mockReturnValueOnce(TE.right({ value: aSubscription.id }))
      .mockReturnValueOnce(TE.right({ value: aSubscriptionHistory.id }));
    mockEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.right(aSubscription),
    );
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionHistory),
    );
    mockEnv.activationRequestRepository.insert.mockReturnValueOnce(
      TE.right(anActivationRequest),
    );

    const actual =
      await processSubscriptionRequest(aSubscriptionRequest)(testEnv)();
    const expected = E.right(aSubscriptionRequest);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestRepository.insert).toBeCalledTimes(1);
  });
  it('should insert the first version of subscription-history if subscription already exists', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicId.mockReturnValueOnce(aMonotonicId);
    mockEnv.clock.now.mockReturnValueOnce(TE.right(aSubscription.createdAt));
    mockEnv.hashFn
      .mockReturnValueOnce(TE.right({ value: aSubscription.id }))
      .mockReturnValueOnce(TE.right({ value: aSubscriptionHistory.id }));
    mockEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.right(aSubscriptionHistory),
    );
    mockEnv.activationRequestRepository.insert.mockReturnValueOnce(
      TE.right(anActivationRequest),
    );

    const actual =
      await processSubscriptionRequest(aSubscriptionRequest)(testEnv)();
    const expected = E.right(aSubscriptionRequest);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestRepository.insert).toBeCalledTimes(1);
  });
  it('should insert the subscription if first version of subscription-history already exists', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicId.mockReturnValueOnce(aMonotonicId);
    mockEnv.clock.now.mockReturnValueOnce(TE.right(aSubscription.createdAt));
    mockEnv.hashFn
      .mockReturnValueOnce(TE.right({ value: aSubscription.id }))
      .mockReturnValueOnce(TE.right({ value: aSubscriptionHistory.id }));
    mockEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.right(aSubscription),
    );
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );
    mockEnv.activationRequestRepository.insert.mockReturnValueOnce(
      TE.right(anActivationRequest),
    );

    const actual =
      await processSubscriptionRequest(aSubscriptionRequest)(testEnv)();
    const expected = E.right(aSubscriptionRequest);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestRepository.insert).toBeCalledTimes(1);
  });
  it('should succeed if the the first version of subscription-history, subscription and activation already exists', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.monotonicId.mockReturnValueOnce(aMonotonicId);
    mockEnv.clock.now.mockReturnValueOnce(TE.right(aSubscription.createdAt));
    mockEnv.hashFn
      .mockReturnValueOnce(TE.right({ value: aSubscription.id }))
      .mockReturnValueOnce(TE.right({ value: aSubscriptionHistory.id }));
    mockEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );
    mockEnv.activationRequestRepository.insert.mockReturnValueOnce(
      TE.left(new ItemAlreadyExists('')),
    );

    const actual =
      await processSubscriptionRequest(aSubscriptionRequest)(testEnv)();
    const expected = E.right(aSubscriptionRequest);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestRepository.insert).toBeCalledTimes(1);
  });
  it('should fail if an unexpected error is raised', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;
    const unexpectedError = new Error('Unexpected error');

    mockEnv.monotonicId.mockReturnValueOnce(aMonotonicId);
    mockEnv.clock.now.mockReturnValueOnce(TE.right(aSubscription.createdAt));
    mockEnv.hashFn
      .mockReturnValueOnce(TE.right({ value: aSubscription.id }))
      .mockReturnValueOnce(TE.right({ value: aSubscriptionHistory.id }));
    mockEnv.subscriptionWriter.insert.mockReturnValueOnce(
      TE.right(aSubscription),
    );
    mockEnv.subscriptionHistoryWriter.insert.mockReturnValueOnce(
      TE.left(unexpectedError),
    );

    const actual =
      await processSubscriptionRequest(aSubscriptionRequest)(testEnv)();
    const expected = E.left(unexpectedError);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.subscriptionWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.subscriptionHistoryWriter.insert).toBeCalledTimes(1);
    expect(mockEnv.activationRequestRepository.insert).not.toHaveBeenCalled();
  });
});

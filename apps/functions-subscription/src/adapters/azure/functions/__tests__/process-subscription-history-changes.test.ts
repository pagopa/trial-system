import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import { makeTestEnv } from '../../../../domain/__tests__/mocks';
import { makeFunctionContext } from './mocks';
import {
  aSubscription,
  aSubscriptionHistory,
} from '../../../../domain/__tests__/data';
import { makeSubscriptionHistoryChangesHandler } from '../process-subscription-history-changes';

describe('makeSubscriptionHistoryChangesHandler', () => {
  it('should call upsert without error', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const documents = [aSubscriptionHistory];

    env.subscriptionWriter.upsert.mockImplementationOnce(() =>
      TE.right(void 0),
    );

    const actual = await makeSubscriptionHistoryChangesHandler(env)(
      documents,
      context,
    );

    expect(actual).toStrictEqual([void 0]);
    expect(env.subscriptionWriter.upsert).toBeCalledWith(aSubscription);
  });
  it('should return an error in case of failure', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const documents = [aSubscriptionHistory];
    const unexpectedError = new Error('Unexpected Error');

    env.subscriptionWriter.upsert.mockImplementationOnce(() =>
      TE.left(unexpectedError),
    );

    const actual = makeSubscriptionHistoryChangesHandler(env)(
      documents,
      context,
    );

    expect(actual).rejects.toStrictEqual(unexpectedError);
  });
});

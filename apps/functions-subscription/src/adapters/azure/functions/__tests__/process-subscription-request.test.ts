import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeSubscriptionRequestConsumerHandler } from '../process-subscription-request';
import { aSubscriptionRequest } from '../../../../domain/__tests__/data';

describe('makeSubscriptionRequestConsumerHandler', () => {
  it('should process subscription-requests without error', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [aSubscriptionRequest];

    env.processSubscriptionRequest.mockReturnValueOnce(
      TE.right(aSubscriptionRequest),
    );

    const actual = await makeSubscriptionRequestConsumerHandler(env)(
      messages,
      context,
    );

    expect(actual).toStrictEqual([aSubscriptionRequest]);
  });

  it('should return an error in case of failure', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [aSubscriptionRequest];
    const unexpectedError = new Error('Unexpected Error');

    env.processSubscriptionRequest.mockReturnValueOnce(
      TE.left(unexpectedError),
    );

    const actual = makeSubscriptionRequestConsumerHandler(env)(
      messages,
      context,
    );

    expect(actual).rejects.toStrictEqual(unexpectedError);
  });
});

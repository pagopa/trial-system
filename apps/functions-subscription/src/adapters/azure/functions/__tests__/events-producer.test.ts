import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import { makeFunctionContext } from './mocks';
import { makeTestEnv } from '../../../../domain/__tests__/mocks';
import {
  aSubscription,
  aSubscriptionHistory,
} from '../../../../domain/__tests__/data';
import { makeEventsProducerCosmosDBHandler } from '../events-producer';

describe('makeEventsProducerCosmosDBHandler', () => {
  it('should send events without error', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const documents = [aSubscriptionHistory];

    env.eventWriter.send.mockImplementationOnce(() => TE.right(void 0));

    const actual = await makeEventsProducerCosmosDBHandler(env)(
      documents,
      context,
    );

    expect(actual).toStrictEqual([void 0]);
    expect(env.eventWriter.send).toBeCalledWith(aSubscription);
  });

  it('should return an error in case of failure', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const documents = [aSubscriptionHistory];
    const unexpectedError = new Error('Unexpected Error');

    env.eventWriter.send.mockImplementationOnce(() => TE.left(unexpectedError));

    const actual = makeEventsProducerCosmosDBHandler(env)(documents, context);

    expect(actual).rejects.toStrictEqual(unexpectedError);
  });
});

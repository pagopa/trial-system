import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { makeAValidGetSubscriptionRequest } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { aSubscription } from '../../../../domain/__tests__/data';
import { ItemNotFound } from '../../../../domain/errors';
import { makeGetSubscriptionHandler } from '../get-subscription';
import { HttpRequest } from '@azure/functions';

describe('makeGetSubscriptionHandler', () => {
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const request = new HttpRequest({
      url: makeAValidGetSubscriptionRequest().url,
      method: makeAValidGetSubscriptionRequest().method,
      headers: { 'x-user-groups': 'Guest,AnotherGroup' },
      body: { string: await makeAValidGetSubscriptionRequest().text() },
    });
    const env = makeTestSystemEnv();
    const actual = await makeGetSubscriptionHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
    });
  });

  it('should return 404 when the subscription does not exist', async () => {
    const env = makeTestSystemEnv();

    const error = new ItemNotFound('Subscription not found');
    env.getSubscription.mockReturnValueOnce(TE.left(error));

    const actual = await makeGetSubscriptionHandler(env)(
      makeAValidGetSubscriptionRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(404);
    expect(await actual.json()).toMatchObject({
      status: 404,
      detail: error.message,
    });
  });

  it('should return 500 when an error occurred', async () => {
    const env = makeTestSystemEnv();

    const error = new Error('Something went wrong');
    env.getSubscription.mockReturnValueOnce(TE.left(error));

    const actual = await makeGetSubscriptionHandler(env)(
      makeAValidGetSubscriptionRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(500);
    expect(await actual.json()).toMatchObject({
      status: 500,
      detail: error.message,
    });
  });

  it('should return 200 when the subscription exist', async () => {
    const env = makeTestSystemEnv();

    env.getSubscription.mockReturnValueOnce(TE.right(aSubscription));

    const actual = await makeGetSubscriptionHandler(env)(
      makeAValidGetSubscriptionRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(200);
    expect(await actual.json()).toMatchObject({
      userId: aSubscription.userId,
      trialId: aSubscription.trialId,
      state: aSubscription.state,
    });
  });

  it('should return 200 when the subscription exist and the x-user-groups header has ApiTrialUser', async () => {
    const env = makeTestSystemEnv();

    env.getSubscription.mockReturnValueOnce(TE.right(aSubscription));

    const request = new HttpRequest({
      url: makeAValidGetSubscriptionRequest().url,
      params: makeAValidGetSubscriptionRequest().params,
      method: makeAValidGetSubscriptionRequest().method,
      headers: { 'x-user-groups': 'ApiTrialUser' },
    });

    const actual = await makeGetSubscriptionHandler(env)(
      request,
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(200);
    expect(await actual.json()).toMatchObject({
      userId: aSubscription.userId,
      trialId: aSubscription.trialId,
      state: aSubscription.state,
    });
  });
});

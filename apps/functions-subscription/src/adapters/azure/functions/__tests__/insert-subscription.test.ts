import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { HttpRequest } from '@azure/functions';
import {
  aCreateSubscription,
  aCreateSubscriptionWithActiveState,
  makeAValidCreateSubscriptionRequest,
  managerHttpRequestHeaders,
  userHttpRequestHeaders,
} from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { SubscriptionStoreError } from '../../../../use-cases/errors';
import {
  aSubscription,
  aTrialOwner,
  aTrialSubscriber,
} from '../../../../domain/__tests__/data';
import { ItemAlreadyExists } from '../../../../domain/errors';
import { makePostSubscriptionHandler } from '../insert-subscription';

describe('makePostSubscriptionHandler', () => {
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const baseRequest =
      makeAValidCreateSubscriptionRequest(aCreateSubscription);
    const request = new HttpRequest({
      url: baseRequest.url,
      method: baseRequest.method,
      headers: {
        ...managerHttpRequestHeaders,
        'x-user-groups': 'Guest,AnotherGroup',
      },
      body: { string: await baseRequest.text() },
    });
    const env = makeTestSystemEnv();
    const actual = await makePostSubscriptionHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
    });
  });
  it('should return 201 with the created subscription', async () => {
    const env = makeTestSystemEnv();
    env.createSubscription.mockReturnValueOnce(TE.right(aSubscription));

    const httpRequest = makeAValidCreateSubscriptionRequest(
      aCreateSubscription,
      userHttpRequestHeaders,
    );

    const actual = await makePostSubscriptionHandler(env)(
      httpRequest,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(201);
    expect(env.createSubscription).toHaveBeenCalledWith(
      aTrialSubscriber,
      aSubscription.userId,
      aSubscription.trialId,
      undefined,
    );
  });

  it('should return 201 with the created subscription with active state', async () => {
    const env = makeTestSystemEnv();
    const anActiveSubscription = { ...aSubscription, state: 'ACTIVE' as const };
    env.createSubscription.mockReturnValueOnce(TE.right(anActiveSubscription));

    const httpRequest = makeAValidCreateSubscriptionRequest(
      aCreateSubscriptionWithActiveState,
    );

    const actual = await makePostSubscriptionHandler(env)(
      httpRequest,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(201);
    expect(env.createSubscription).toHaveBeenCalledWith(
      aTrialOwner,
      anActiveSubscription.userId,
      anActiveSubscription.trialId,
      anActiveSubscription.state,
    );
  });

  it('should return 202 on SubscriptionStoreError', async () => {
    const env = makeTestSystemEnv();
    env.createSubscription.mockReturnValueOnce(
      TE.left(new SubscriptionStoreError()),
    );

    const actual = await makePostSubscriptionHandler(env)(
      makeAValidCreateSubscriptionRequest(aCreateSubscription),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(202);
  });

  it('should return 400 when the request body is not valid', async () => {
    const aRequestWithInvalidBody = new HttpRequest({
      url: 'https://function/trials/{trialId}/subscriptions',
      method: 'POST',
      body: { string: '{}' },
      headers: managerHttpRequestHeaders,
      params: {
        trialId: 'aTrialId012345678901234567',
      },
    });
    const env = makeTestSystemEnv();
    const actual = await makePostSubscriptionHandler(env)(
      aRequestWithInvalidBody,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(400);
    expect(await actual.json()).toMatchObject({
      status: 400,
      detail: 'Missing or invalid body',
    });
  });

  it('should return 409 when the subscription already exists', async () => {
    const env = makeTestSystemEnv();
    const error = new ItemAlreadyExists('Already exists');
    env.createSubscription.mockReturnValueOnce(TE.left(error));
    const actual = await makePostSubscriptionHandler(env)(
      makeAValidCreateSubscriptionRequest(aCreateSubscription),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(409);
    expect(await actual.json()).toMatchObject({
      status: 409,
      detail: error.message,
    });
  });

  it('should return 500 when the use case returned an error', async () => {
    const env = makeTestSystemEnv();
    const error = new Error('Something went wrong');
    env.createSubscription.mockReturnValueOnce(TE.left(error));

    const actual = await makePostSubscriptionHandler(env)(
      makeAValidCreateSubscriptionRequest(aCreateSubscription),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(500);
    expect(await actual.json()).toMatchObject({
      status: 500,
      detail: error.message,
    });
  });
});

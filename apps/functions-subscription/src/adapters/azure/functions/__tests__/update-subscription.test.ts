import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { HttpRequest } from '@azure/functions';
import {
  makeAValidUpdateSubscriptionRequest,
  managerHttpRequestHeaders,
} from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import {
  anActivationRequest,
  aTrialOwner,
} from '../../../../domain/__tests__/data';
import { ItemNotFound } from '../../../../domain/errors';
import { makePutSubscriptionHandler } from '../update-subscription';
import { SubscriptionStateEnum } from '../../../../generated/definitions/internal/SubscriptionState';

describe('makeUpdateSubscriptionHandler', () => {
  const anUpdateSubscription = {
    state: SubscriptionStateEnum.DISABLED,
  };
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const baseRequest =
      makeAValidUpdateSubscriptionRequest(anUpdateSubscription);
    const request = new HttpRequest({
      url: baseRequest.url,
      method: baseRequest.method,
      headers: {
        ...managerHttpRequestHeaders,
        'x-user-groups': 'Guest,AnotherGroup',
      },
      body: { string: await baseRequest.text() },
      params: baseRequest.params,
    });
    const env = makeTestSystemEnv();
    const actual = await makePutSubscriptionHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
    });
  });

  it('should return 202', async () => {
    const env = makeTestSystemEnv();
    env.updateSubscription.mockReturnValueOnce(TE.right(anActivationRequest));

    const actual = await makePutSubscriptionHandler(env)(
      makeAValidUpdateSubscriptionRequest(anUpdateSubscription),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(202);
    expect(env.updateSubscription).toHaveBeenCalledWith(
      aTrialOwner,
      anActivationRequest.userId,
      anActivationRequest.trialId,
      anUpdateSubscription.state,
    );
  });

  it('should return 400 when the request body is not valid', async () => {
    const baseRequest =
      makeAValidUpdateSubscriptionRequest(anUpdateSubscription);
    const aRequestWithInvalidBody = new HttpRequest({
      url: baseRequest.url,
      method: baseRequest.method,
      headers: managerHttpRequestHeaders,
      body: { string: '{}' },
      params: baseRequest.params,
    });
    const env = makeTestSystemEnv();
    const actual = await makePutSubscriptionHandler(env)(
      aRequestWithInvalidBody,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(400);
    expect(await actual.json()).toMatchObject({
      status: 400,
      detail: 'Missing or invalid body',
    });
  });

  it('should return 404 when the subscription does not exist', async () => {
    const env = makeTestSystemEnv();
    const error = new ItemNotFound('Not Found');
    env.updateSubscription.mockReturnValueOnce(TE.left(error));
    const actual = await makePutSubscriptionHandler(env)(
      makeAValidUpdateSubscriptionRequest(anUpdateSubscription),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(404);
    expect(await actual.json()).toMatchObject({
      status: 404,
      detail: error.message,
    });
  });

  it('should return 500 when the use case returned an error', async () => {
    const env = makeTestSystemEnv();
    const error = new Error('Something went wrong');
    env.updateSubscription.mockReturnValueOnce(TE.left(error));

    const actual = await makePutSubscriptionHandler(env)(
      makeAValidUpdateSubscriptionRequest(anUpdateSubscription),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(500);
    expect(await actual.json()).toMatchObject({
      status: 500,
      detail: error.message,
    });
  });
});

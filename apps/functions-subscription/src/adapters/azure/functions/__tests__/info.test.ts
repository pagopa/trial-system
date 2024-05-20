import { describe, expect, it } from 'vitest';
import { makeInfoHandler } from '../info';
import { HttpRequest } from '@azure/functions';
import { makeFunctionContext, makeTestInfoEnv } from './mocks';

const request = new HttpRequest({
  url: 'https://function/info',
  method: 'GET',
});
const context = makeFunctionContext();

describe('info', () => {
  it('should return 200 if the application is healthy', async () => {
    const { env, mocks } = makeTestInfoEnv();

    mocks.cosmosDB.getDatabaseAccount.mockResolvedValueOnce(true);
    mocks.subscriptionRequestEventHub.getEventHubProperties.mockResolvedValueOnce(
      true,
    );

    const actual = await makeInfoHandler(env)(request, context);
    const expected = {
      message: `Pong from ${request.url}`,
    };
    expect(actual.status).toStrictEqual(200);
    expect(await actual.json()).toMatchObject(expected);
  });

  it('should return 500 if cosmos is unhealthy', async () => {
    const { env, mocks } = makeTestInfoEnv();

    mocks.cosmosDB.getDatabaseAccount.mockRejectedValueOnce(
      new Error('connection issue'),
    );
    mocks.subscriptionRequestEventHub.getEventHubProperties.mockResolvedValueOnce(
      true,
    );

    const actual = await makeInfoHandler(env)(request, context);
    const expected = {
      status: 500,
      detail: 'CosmosDB|connection issue',
      title: 'Internal Server Error',
    };
    expect(actual.status).toStrictEqual(500);
    expect(await actual.json()).toMatchObject(expected);
  });

  it('should return 500 if event hub is unhealthy', async () => {
    const { env, mocks } = makeTestInfoEnv();

    mocks.cosmosDB.getDatabaseAccount.mockResolvedValueOnce(true);
    mocks.subscriptionRequestEventHub.getEventHubProperties.mockRejectedValueOnce(
      new Error('connection issue'),
    );

    const actual = await makeInfoHandler(env)(request, context);
    const expected = {
      status: 500,
      detail: 'Subscription Request EventHub|connection issue',
      title: 'Internal Server Error',
    };
    expect(actual.status).toStrictEqual(500);
    expect(await actual.json()).toMatchObject(expected);
  });
});

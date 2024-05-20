import { app } from '@azure/functions';
import { makeInfoHandler } from './adapters/azure/functions/info';
import { makePostSubscriptionHandler } from './adapters/azure/functions/subscriptions';
import { SystemEnv } from './system-env';

/**
 * FIXME: At the moment, we do not have implementations for the env.
 * To let the code properly work, we are creating an empty object.
 */
const env = {} as unknown as SystemEnv;

app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: makeInfoHandler({}),
  route: 'info',
});

app.http('/trials/{trialId}/subscriptions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: makePostSubscriptionHandler(env),
  route: '/trials/{trialId}/subscriptions',
});

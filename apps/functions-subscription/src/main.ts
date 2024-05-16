import { app } from '@azure/functions';
import { makeInfoHandler } from './adapters/azure/functions/info';
import { makePostSubscriptionHandler } from './adapters/azure/functions/subscriptions';
import { Capabilities } from './domain/capabilities';

/** FIXME: At the moment, we do not have implementations for the capabilities.
 * To let the code properly work, we are creating an empty object.
 */
const capabilities = {} as unknown as Capabilities;

// eslint-disable-next-line functional/no-expression-statements
app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: makeInfoHandler({}),
  route: 'info',
});

// eslint-disable-next-line functional/no-expression-statements
app.http('/trials/{trialId}/subscriptions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: makePostSubscriptionHandler(capabilities),
  route: '/trials/{trialId}/subscriptions',
});

import { app } from '@azure/functions';
import { makeInfoFunction } from './adapters/azure/functions/info';

// eslint-disable-next-line functional/no-expression-statements
app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: makeInfoFunction({}),
  route: 'info',
});

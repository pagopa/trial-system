import { app } from '@azure/functions';
import { InfoFunction } from './functions/info';

const Info = InfoFunction({});

// eslint-disable-next-line functional/no-expression-statements
app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: Info,
  route: 'info',
});

import { app } from '@azure/functions';
import { InfoFunction } from './functions/info';

const Info = InfoFunction({});

app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: Info,
  route: 'info',
});

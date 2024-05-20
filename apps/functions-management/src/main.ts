import { app } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';
import { InfoFunction } from './adapters/azure/functions/info';
import { getConfigOrThrow } from './utils/config';

const config = getConfigOrThrow();

const cosmosClient = new CosmosClient(config.COSMOS_CONNECTION_STRING);
const database = cosmosClient.database(config.COSMOS_DB_NAME);

// eslint-disable-next-line functional/no-expression-statements
app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: InfoFunction({ db: database }),
  route: 'info',
});

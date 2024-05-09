import { app } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';
import { InfoFunction } from './adapters/azure/functions/info';
import { getConfigOrThrow } from './utils/config';
import { TRIAL_COLLECTION_NAME, TrialModel } from './models/trial';
import { CreateTrialFunction } from './adapters/azure/functions/createTrial';

const config = getConfigOrThrow();

const cosmosClient = new CosmosClient(config.COSMOS_CONNECTION_STRING);
const database = cosmosClient.database(config.COSMOS_DB_NAME);

const trialContainer = database.container(TRIAL_COLLECTION_NAME);
const trialModel = new TrialModel(trialContainer);

// eslint-disable-next-line functional/no-expression-statements
app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: InfoFunction({ db: database }),
  route: 'info',
});

app.http('trials', {
  methods: ['POST'],
  authLevel: 'function',
  handler: CreateTrialFunction({ trialModel }),
  route: 'api/v1/trials'
})

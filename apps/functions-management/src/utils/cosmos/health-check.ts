import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  HealthCheck,
  toHealthProblems,
} from '@pagopa/io-functions-commons/dist/src/utils/healthcheck';
import { CosmosDBDependency } from './dependency';

export type AzureCosmosProblemSource = 'AzureCosmosDB';

export const makeAzureCosmosDbHealthCheck = ({
  db,
}: CosmosDBDependency): HealthCheck<AzureCosmosProblemSource> =>
  pipe(
    TE.tryCatch(
      () => db.client.getDatabaseAccount(),
      toHealthProblems('AzureCosmosDB' as const),
    ),
    TE.map(() => true),
  );

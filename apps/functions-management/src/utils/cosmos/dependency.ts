import { Database } from '@azure/cosmos';

export interface CosmosDBDependency {
  readonly db: Database;
}

import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { withDefault } from '@pagopa/ts-commons/lib/types';
import {
  CosmosResource,
  CosmosdbModel,
} from '@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model';
import * as t from 'io-ts';
import { Container } from '@azure/cosmos';

export const TRIAL_COLLECTION_NAME = 'trials';
export const TRIAL_MODEL_PK_FIELD = 'id';

export const Trial = t.intersection([
  t.type({
    id: NonEmptyString,
    name: NonEmptyString,
    isEnabled: withDefault(t.boolean, false),
  }),
  t.partial({
    description: NonEmptyString,
  }),
]);

export type Trial = t.TypeOf<typeof Trial>;

export const RetrievedTrial = t.intersection([Trial, CosmosResource]);
export type RetrievedTrial = t.TypeOf<typeof RetrievedTrial>;

export class TrialModel extends CosmosdbModel<
  Trial,
  Trial,
  RetrievedTrial,
  typeof TRIAL_MODEL_PK_FIELD
> {
  /**
   * Creates a new MessageView model
   *
   * @param container the Cosmos container client
   */
  constructor(container: Container) {
    super(container, Trial, RetrievedTrial);
  }
}

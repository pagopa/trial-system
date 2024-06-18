import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { Database } from '@azure/cosmos';
import { ActivationJobWriter } from '../../../domain/activation-job';
import { cosmosErrorToDomainError } from './errors';

export const makeActivationJobCosmosContainer = (
  db: Database,
): ActivationJobWriter => {
  const container = db.container('activations');
  return {
    insert: (job) =>
      pipe(
        TE.tryCatch(() => container.items.create(job), E.toError),
        TE.mapBoth(cosmosErrorToDomainError, () => job),
      ),
  };
};

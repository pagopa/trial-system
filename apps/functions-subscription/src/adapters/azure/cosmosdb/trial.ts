import { Database } from '@azure/cosmos';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { TrialReader, TrialWriter } from '../../../domain/trial';
import { cosmosErrorToDomainError } from './errors';

export const makeTrialsCosmosContainer = (
  db: Database,
): TrialReader & TrialWriter => {
  const container = db.container('trials');
  return {
    get: () => TE.right(O.none),
    insert: (trial) =>
      pipe(
        TE.tryCatch(() => container.items.create(trial), E.toError),
        TE.mapBoth(cosmosErrorToDomainError, () => trial),
      ),
  };
};

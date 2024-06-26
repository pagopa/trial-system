import { Database } from '@azure/cosmos';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { TrialWriter } from '../../../domain/trial';
import { cosmosErrorToDomainError } from './errors';

export const makeTrialsCosmosContainer = (db: Database): TrialWriter => {
  const container = db.container('trials');
  return {
    insert: (trial) =>
      pipe(
        TE.tryCatch(() => container.items.create(trial), E.toError),
        TE.mapBoth(cosmosErrorToDomainError, () => trial),
      ),
  };
};

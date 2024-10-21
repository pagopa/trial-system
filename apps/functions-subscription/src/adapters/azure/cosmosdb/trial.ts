import { Database } from '@azure/cosmos';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { cosmosErrorToDomainError } from './errors';
import { decodeFromItem, decodeFromFeed } from './decode';
import { TrialCodec, TrialReader, TrialWriter } from '../../../domain/trial';

export const makeTrialsCosmosContainer = (
  db: Database,
): TrialReader & TrialWriter => {
  const container = db.container('trials');
  return {
    get: (trialId) =>
      pipe(
        TE.tryCatch(() => container.item(trialId, trialId).read(), E.toError),
        TE.flatMapEither(decodeFromItem(TrialCodec)),
      ),
    getAll: () =>
      pipe(
        TE.tryCatch(() => container.items.readAll().fetchAll(), E.toError),
        TE.flatMapEither(decodeFromFeed(TrialCodec)),
      ),
    insert: (trial) =>
      pipe(
        TE.tryCatch(() => container.items.create(trial), E.toError),
        TE.mapBoth(cosmosErrorToDomainError, () => trial),
      ),
    upsert: (trial) =>
      pipe(
        TE.tryCatch(() => container.items.upsert(trial), E.toError),
        TE.mapBoth(cosmosErrorToDomainError, () => trial),
      ),
  };
};

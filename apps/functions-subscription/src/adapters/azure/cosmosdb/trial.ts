import { Database } from '@azure/cosmos';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { cosmosErrorToDomainError } from './errors';
import { decodeFromFeed } from './decode';
import { TrialCodec, TrialReader, TrialWriter } from '../../../domain/trial';
import * as RA from 'fp-ts/ReadonlyArray';

export const makeTrialsCosmosContainer = (
  db: Database,
  containerName: string,
): TrialReader & TrialWriter => {
  const container = db.container(containerName);
  return {
    get: (trialId) =>
      pipe(
        TE.tryCatch(
          () =>
            container.items
              .query({
                query: 'SELECT * FROM c WHERE c.id = @id OFFSET 0 LIMIT 1',
                parameters: [
                  {
                    name: '@id',
                    value: trialId,
                  },
                ],
              })
              .fetchAll(),
          E.toError,
        ),
        TE.flatMapEither(decodeFromFeed(TrialCodec)),
        TE.mapBoth(cosmosErrorToDomainError, RA.head),
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

import { Database } from '@azure/cosmos';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { cosmosErrorToDomainError } from './errors';
import { decodeFromFeed, decodeFromItem } from './decode';
import { TrialCodec, TrialReader, TrialWriter } from '../../../domain/trial';
import * as RA from 'fp-ts/ReadonlyArray';

const emptyMessageParameter = {
  condition: '',
  parameters: [],
};

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
    getByIdAndOwnerId: (trialId, ownerId) =>
      pipe(
        TE.tryCatch(() => container.item(trialId, ownerId).read(), E.toError),
        TE.flatMapEither(decodeFromItem(TrialCodec)),
      ),
    list: (options) =>
      pipe(
        {
          parameters: [],
          query: `SELECT * FROM t`,
        },
        TE.of,
        TE.bindTo('commonQuerySpec'),
        TE.bind('maxMessagesParams', () =>
          pipe(
            O.fromNullable(options.maximumId),
            O.foldW(
              () => emptyMessageParameter,
              (maximumId) => ({
                condition: ` WHERE t.id < @maxId`,
                parameters: [{ name: '@maxId', value: maximumId }],
              }),
            ),
            TE.of,
          ),
        ),
        TE.bind('minMessagesParams', () =>
          pipe(
            O.fromNullable(options.minimumId),
            O.foldW(
              () => emptyMessageParameter,
              (minimumId) => ({
                condition: `${options.maximumId ? ' AND' : ' WHERE'} t.id > @minId`,
                parameters: [{ name: '@minId', value: minimumId }],
              }),
            ),
            TE.of,
          ),
        ),
        TE.chain(({ commonQuerySpec, maxMessagesParams, minMessagesParams }) =>
          TE.tryCatch(
            () =>
              container.items
                .query({
                  parameters: [
                    ...commonQuerySpec.parameters,
                    ...maxMessagesParams.parameters,
                    ...minMessagesParams.parameters,
                    { name: '@limit', value: options.pageSize },
                  ],
                  query: `${commonQuerySpec.query}${maxMessagesParams.condition}${minMessagesParams.condition} ORDER BY t.id DESC OFFSET 0 LIMIT @limit`,
                })
                .fetchAll(),
            E.toError,
          ),
        ),
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

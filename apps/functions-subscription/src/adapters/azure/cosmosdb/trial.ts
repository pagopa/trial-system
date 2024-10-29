import { Database } from '@azure/cosmos';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { cosmosErrorToDomainError } from './errors';
import { decodeFromItem, decodeFromFeed } from './decode';
import { TrialCodec, TrialReader, TrialWriter } from '../../../domain/trial';

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
        TE.tryCatch(() => container.item(trialId, trialId).read(), E.toError),
        TE.flatMapEither(decodeFromItem(TrialCodec)),
      ),
    list: (pageSize, maximumId, minimumId) =>
      pipe(
        {
          parameters: [],
          // WHERE 1=1 here ensures the where clause works without minimumId or maximumId, withoud adding additional logic
          query: `SELECT * FROM t WHERE 1=1`,
        },
        TE.of,
        TE.bindTo('commonQuerySpec'),
        TE.bind('maxMessagesParams', () =>
          pipe(
            O.fromNullable(maximumId),
            O.foldW(
              () => emptyMessageParameter,
              (maximumId) => ({
                condition: ` AND t.id < @maxId`,
                parameters: [{ name: '@maxId', value: maximumId }],
              }),
            ),
            TE.of,
          ),
        ),
        TE.bind('minMessagesParams', () =>
          pipe(
            O.fromNullable(minimumId),
            O.foldW(
              () => emptyMessageParameter,
              (minimumId) => ({
                condition: ` AND t.id > @minId`,
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
                    { name: '@limit', value: pageSize },
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

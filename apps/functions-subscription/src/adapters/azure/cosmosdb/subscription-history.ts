import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import { Database } from '@azure/cosmos';
import {
  SubscriptionHistoryCodec,
  SubscriptionHistoryReader,
  SubscriptionHistoryWriter,
} from '../../../domain/subscription-history';
import { cosmosErrorToDomainError } from './errors';
import { decodeFromFeed } from './decode';

export const makeSubscriptionHistoryCosmosContainer = (
  db: Database,
): SubscriptionHistoryReader & SubscriptionHistoryWriter => {
  const container = db.container('subscription-history');
  return {
    getLatest: ({ subscriptionId }) =>
      pipe(
        TE.tryCatch(
          () =>
            container.items
              .query({
                query:
                  'SELECT * FROM c WHERE subscriptionId = @sId ORDER BY version DESC OFFEST 0 LIMIT 1',
                parameters: [
                  {
                    name: '@sId',
                    value: subscriptionId,
                  },
                ],
              })
              .fetchAll(),
          E.toError,
        ),
        TE.flatMapEither(decodeFromFeed(SubscriptionHistoryCodec)),
        TE.map(RA.head),
      ),
    insert: (subscriptionHistory) =>
      pipe(
        TE.tryCatch(
          () => container.items.create(subscriptionHistory),
          E.toError,
        ),
        TE.mapBoth(cosmosErrorToDomainError, () => subscriptionHistory),
      ),
  };
};

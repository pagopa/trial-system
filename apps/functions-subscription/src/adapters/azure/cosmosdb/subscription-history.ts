import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { Database } from '@azure/cosmos';
import { SubscriptionHistoryWriter } from '../../../domain/subscription-history';
import { cosmosErrorToDomainError } from './errors';

export const makeSubscriptionHistoryCosmosContainer = (
  db: Database,
): SubscriptionHistoryWriter => {
  const container = db.container('subscription-history');
  return {
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

import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { Database, ErrorResponse } from '@azure/cosmos';
import {
  SubscriptionCodec,
  SubscriptionReader,
  SubscriptionWriter,
} from '../../../domain/subscription';
import { ItemAlreadyExists } from '../../../domain/errors';
import { decodeFromItem } from './decode';

export const makeSubscriptionCosmosContainer = (
  db: Database,
): SubscriptionReader & SubscriptionWriter => {
  const container = db.container('subscription');
  return {
    get: (subscriptionId) =>
      pipe(
        TE.tryCatch(
          () => container.item(subscriptionId, subscriptionId).read(),
          E.toError,
        ),
        TE.flatMapEither(decodeFromItem(SubscriptionCodec)),
      ),
    insert: (subscription) =>
      pipe(
        TE.tryCatch(() => container.items.create(subscription), E.toError),
        TE.map(() => subscription),
        TE.mapLeft((error) => {
          if (error instanceof ErrorResponse)
            if (error.code === 409)
              return new ItemAlreadyExists(
                `The item (${subscription.id}) already exists`,
              );
            else return error;
          else return error;
        }),
      ),
  };
};

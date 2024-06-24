import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as RTE from 'fp-ts/ReaderTaskEither';
import {
  getSubscriptionById,
  makeSubscription,
  Subscription,
  TrialId,
  UserId,
} from '../domain/subscription';
import { SubscriptionStoreError } from './errors';
import { ItemAlreadyExists } from '../domain/errors';
import {
  insertSubscription as insertSubscriptionRTE,
  enqueueSubscription,
} from '../domain/subscription';

const handleMissingSubscription = (subscription: Subscription) =>
  pipe(
    enqueueSubscription(subscription),
    RTE.flatMap(() =>
      pipe(
        insertSubscriptionRTE(subscription),
        RTE.mapLeft(() => new SubscriptionStoreError()),
      ),
    ),
  );

export const createSubscription = (
  userId: UserId,
  trialId: TrialId,
  state: Extract<Subscription['state'], 'ACTIVE' | 'SUBSCRIBED'> = 'SUBSCRIBED',
) =>
  pipe(
    RTE.Do,
    RTE.apS('subscription', makeSubscription({ userId, trialId, state })),
    RTE.chainFirstW(({ subscription }) =>
      pipe(
        getSubscriptionById(subscription.id),
        RTE.flatMap(
          O.fold(
            () => handleMissingSubscription(subscription),
            () =>
              RTE.left(new ItemAlreadyExists('Subscription already exists')),
          ),
        ),
      ),
    ),
    RTE.map(({ subscription }) => subscription),
  );

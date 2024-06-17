import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import {
  getSubscriptionById,
  makeSubscription,
  Subscription,
  SubscriptionId,
  TrialId,
  UserId,
} from '../domain/subscription';
import { SubscriptionStoreError } from './errors';
import { ItemAlreadyExists } from '../domain/errors';
import {
  insertSubscriptionHistory,
  makeSubscriptionHistory,
} from '../domain/subscription-history';
import { insertSubscriptionRequest } from '../domain/subscription-request';
import { insertSubscription as insertSubscriptionRTE } from '../domain/subscription';

// Maps all the requirements for this use-case
type Env = Pick<
  Capabilities,
  | 'subscriptionRequestWriter'
  | 'subscriptionReader'
  | 'subscriptionWriter'
  | 'subscriptionHistoryWriter'
  | 'hashFn'
  | 'clock'
>;

const handleSubscriptionAlreadyExists = (id: SubscriptionId) =>
  pipe(
    getSubscriptionById(id),
    RTE.flatMapTaskEither(
      O.fold(
        () => TE.right(id),
        () => TE.left(new ItemAlreadyExists('Subscription already exists')),
      ),
    ),
  );

const handleMissingSubscription = (subscription: Subscription) =>
  pipe(
    insertSubscriptionRequest({
      userId: subscription.userId,
      trialId: subscription.trialId,
    }),
    RTE.flatMap(() =>
      pipe(
        insertSubscriptionRTE(subscription),
        RTE.mapLeft(() => new SubscriptionStoreError()),
      ),
    ),
  );

const handleSubscription = (subscription: Subscription) =>
  pipe(
    makeSubscriptionHistory(subscription),
    RTE.flatMap(insertSubscriptionHistory),
    RTE.map(() => subscription),
  );

export const insertSubscription = (
  userId: UserId,
  trialId: TrialId,
  state?: Extract<Subscription['state'], 'ACTIVE' | 'SUBSCRIBED'>,
) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('subscription', makeSubscription(trialId, userId)),
    RTE.chainFirstW(({ subscription: { id } }) =>
      handleSubscriptionAlreadyExists(id),
    ),
    RTE.chainW(({ subscription }) =>
      state
        ? handleSubscription({ ...subscription, state })
        : handleMissingSubscription(subscription),
    ),
  );

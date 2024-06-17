import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import {
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

const handleSubscriptionAlreadyExists =
  (id: SubscriptionId) => (env: Pick<Capabilities, 'subscriptionReader'>) =>
    pipe(
      env.subscriptionReader.get(id),
      TE.flatMap(
        O.fold(
          () => TE.right(id),
          () => TE.left(new ItemAlreadyExists('Subscription already exists')),
        ),
      ),
    );

const handleMissingSubscription = (subscription: Subscription) => {
  if (subscription.state === 'ACTIVE') {
    return pipe(
      makeSubscriptionHistory(subscription),
      RTE.flatMap(insertSubscriptionHistory),
      RTE.map(() => subscription),
    );
  } else {
    const { userId, trialId } = subscription;
    return pipe(
      insertSubscriptionRequest({ userId, trialId }),
      RTE.flatMap(() =>
        pipe(
          insertSubscriptionRTE(subscription),
          RTE.mapLeft(() => new SubscriptionStoreError()),
        ),
      ),
    );
  }
};

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
      handleMissingSubscription({
        ...subscription,
        state: state ?? 'SUBSCRIBED',
      }),
    ),
  );

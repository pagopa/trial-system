import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import {
  SubscriptionId,
  TrialId,
  UserId,
  makeSubscriptionId,
} from '../domain/subscription';
import { nowDate } from '../domain/clock';
import { SubscriptionStoreError } from './errors';
import { ItemAlreadyExists } from '../domain/errors';

// Maps all the requirements for this use-case
type Env = Pick<
  Capabilities,
  | 'subscriptionRequestWriter'
  | 'subscriptionReader'
  | 'subscriptionWriter'
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
          () =>
            TE.left(
              new ItemAlreadyExists('Subscription already exists'),
            ),
        ),
      ),
    );

const handleMissingSubscription =
  (userId: UserId, trialId: TrialId, id: SubscriptionId, now: Date) =>
  ({ subscriptionRequestWriter, subscriptionWriter }: Env) =>
    pipe(
      subscriptionRequestWriter.insert({ userId, trialId }),
      TE.flatMap(() =>
        pipe(
          subscriptionWriter.insert({
            id,
            userId,
            trialId,
            createdAt: now,
            updatedAt: now,
            state: 'SUBSCRIBED',
          }),
          TE.mapLeft(() => new SubscriptionStoreError()),
        ),
      ),
    );

export const insertSubscription = (userId: UserId, trialId: TrialId) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('id', makeSubscriptionId(trialId, userId)),
    RTE.chainFirstW(({ id }) => handleSubscriptionAlreadyExists(id)),
    RTE.apSW('now', nowDate()),
    RTE.chainW(({ id, now }) =>
      handleMissingSubscription(userId, trialId, id, now),
    ),
  );

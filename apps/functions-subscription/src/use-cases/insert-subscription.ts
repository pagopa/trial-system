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
import { SubscriptionAlreadyExists } from './errors';
import { nowDate } from '../domain/clock';

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
              new SubscriptionAlreadyExists('Subscription already exists'),
            ),
        ),
      ),
    );

const handleMissingSubscription =
  (userId: UserId, trialId: TrialId, id: SubscriptionId, now: Date) =>
  (env: Env) =>
    pipe(
      env.subscriptionRequestWriter.insert({ userId, trialId }),
      TE.flatMap(() =>
        env.subscriptionWriter.insert({
          id,
          userId,
          trialId,
          createdAt: now,
          updatedAt: now,
          state: 'SUBSCRIBED',
        }),
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

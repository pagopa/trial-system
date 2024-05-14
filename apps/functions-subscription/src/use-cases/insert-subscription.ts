import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import { TrialId, UserId, makeSubscriptionId } from '../domain/subscription';
import { SubscriptionAlreadyExists } from './errors';

// Maps all the requirements for this use-case
type Env = Pick<
  Capabilities,
  | 'subscriptionRequestWriter'
  | 'subscriptionReader'
  | 'subscriptionWriter'
  | 'hashFn'
>;

export const insertSubscription = (userId: UserId, trialId: TrialId) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('id', makeSubscriptionId(trialId, userId)),
    RTE.flatMapTaskEither(
      ({
        subscriptionReader,
        subscriptionWriter,
        subscriptionRequestWriter,
        id,
      }) =>
        pipe(
          subscriptionReader.get(id),
          TE.flatMap(
            O.fold(
              () =>
                pipe(
                  subscriptionRequestWriter.insert({ userId, trialId }),
                  TE.flatMap(() =>
                    subscriptionWriter.insert({ userId, trialId, id }),
                  ),
                ),
              () =>
                TE.left(
                  new SubscriptionAlreadyExists('Subscription already exists'),
                ),
            ),
          ),
        ),
    ),
  );

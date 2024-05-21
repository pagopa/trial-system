import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import {
  TrialId,
  UserId,
  makeSubscriptionId,
  SubscriptionId,
} from '../domain/subscription';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { ItemNotFound } from '../domain/errors';

// Maps all the requirements for this use-case
type Env = Pick<Capabilities, 'subscriptionReader' | 'hashFn'>;

const getSubscriptionById =
  (id: SubscriptionId) => (env: Pick<Capabilities, 'subscriptionReader'>) =>
    pipe(
      env.subscriptionReader.get(id),
      TE.flatMap(
        O.fold(
          () => TE.left(new ItemNotFound(`Subscription ${id} not found`)),
          (subscription) => TE.right(subscription),
        ),
      ),
    );

export const getSubscription = (userId: UserId, trialId: TrialId) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('id', makeSubscriptionId(trialId, userId)),
    RTE.chainW(({ id }) => getSubscriptionById(id)),
  );

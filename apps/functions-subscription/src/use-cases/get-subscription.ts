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
import { ItemNotFound } from '../domain/errors';

// Maps all the requirements for this use-case
type GetSubscriptionEnv = Pick<Capabilities, 'subscriptionReader'>;

const getSubscriptionById =
  (id: SubscriptionId) => (env: Pick<Capabilities, 'subscriptionReader'>) =>
    pipe(
      env.subscriptionReader.get(id),
      TE.flatMap(
        TE.fromOption(() => new ItemNotFound(`Subscription ${id} not found`)),
      ),
    );

export const getSubscription = (userId: UserId, trialId: TrialId) =>
  pipe(
    RTE.ask<GetSubscriptionEnv>(),
    RTE.apSW('id', makeSubscriptionId(trialId, userId)),
    RTE.flatMap(({ id }) => getSubscriptionById(id)),
  );

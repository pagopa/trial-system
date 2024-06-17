import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import {
  TrialId,
  UserId,
  makeSubscriptionId,
  getSubscriptionById,
} from '../domain/subscription';
import { ItemNotFound } from '../domain/errors';

// Maps all the requirements for this use-case
type GetSubscriptionEnv = Pick<Capabilities, 'subscriptionReader'>;

export const getSubscription = (userId: UserId, trialId: TrialId) =>
  pipe(
    RTE.ask<GetSubscriptionEnv>(),
    RTE.apSW('id', makeSubscriptionId(trialId, userId)),
    RTE.flatMap(({ id }) =>
      pipe(
        getSubscriptionById(id),
        RTE.flatMap(
          RTE.fromOption(() => new ItemNotFound('Subscription not found')),
        ),
      ),
    ),
  );

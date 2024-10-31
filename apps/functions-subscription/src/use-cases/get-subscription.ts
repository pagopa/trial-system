import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import {
  getSubscriptionById,
  makeSubscriptionId,
  UserId,
} from '../domain/subscription';
import { ItemNotFound } from '../domain/errors';
import { getTrialIdByTenant, TrialId } from '../domain/trial';
import { Tenant } from '../domain/users';

const subscriptionNotFoundError = new ItemNotFound('Subscription not found');

export const getSubscription = (
  tenant: Tenant,
  userId: UserId,
  trialId: TrialId,
) =>
  pipe(
    getTrialIdByTenant(trialId, tenant),
    RTE.mapLeft(() => subscriptionNotFoundError),
    RTE.flatMap((id) => makeSubscriptionId(id, userId)),
    RTE.flatMap(getSubscriptionById),
    RTE.flatMapOption(
      (subscription) => subscription,
      () => subscriptionNotFoundError,
    ),
  );

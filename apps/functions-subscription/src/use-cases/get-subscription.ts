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

export const getSubscription = (
  tenant: Tenant,
  userId: UserId,
  trialId: TrialId,
) =>
  pipe(
    getTrialIdByTenant(trialId, tenant),
    RTE.mapLeft(() => new ItemNotFound('Subscription not found')),
    RTE.flatMap((id) => makeSubscriptionId(id, userId)),
    RTE.flatMap(getSubscriptionById),
    RTE.flatMapOption(
      (subscription) => subscription,
      () => new ItemNotFound('Subscription not found'),
    ),
  );

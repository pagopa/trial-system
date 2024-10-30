import { flow, pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as O from 'fp-ts/Option';
import {
  getSubscriptionById,
  makeSubscriptionId,
  UserId,
} from '../domain/subscription';
import { ItemNotFound } from '../domain/errors';
import { getTrialById, TrialId } from '../domain/trial';
import { Tenant } from '../domain/users';

const subscriptionNotFoundError = new ItemNotFound('Subscription not found');

const makeTrialId = (tenant: Tenant, trialId: TrialId) =>
  pipe(
    tenant.type === 'owner'
      ? pipe(
          getTrialById(trialId, tenant),
          RTE.flatMapOption(
            flow(O.map(({ id }) => id)),
            () => subscriptionNotFoundError,
          ),
        )
      : RTE.of(trialId),
  );

export const getSubscription = (
  tenant: Tenant,
  userId: UserId,
  trialId: TrialId,
) =>
  pipe(
    makeTrialId(tenant, trialId),
    RTE.flatMap((id) => makeSubscriptionId(id, userId)),
    RTE.flatMap(getSubscriptionById),
    RTE.flatMapOption(
      (subscription) => subscription,
      () => subscriptionNotFoundError,
    ),
  );

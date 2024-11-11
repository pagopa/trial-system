import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Subscription, UserId } from '../domain/subscription';
import { getTrialIdByTenant, TrialId } from '../domain/trial';
import {
  updateActivationRequestState,
  getActivationRequest,
} from '../domain/activation-request';
import { Tenant } from '../domain/users';
import { ItemNotFound } from '../domain/errors';

export const updateSubscription = (
  tenant: Tenant,
  userId: UserId,
  trialId: TrialId,
  state: Subscription['state'],
) =>
  pipe(
    getTrialIdByTenant(trialId, tenant),
    RTE.mapLeft(() => new ItemNotFound('Subscription not found')),
    RTE.flatMap((id) => getActivationRequest(id, userId)),
    RTE.flatMapOption(
      (req) => req,
      () => new ItemNotFound('Subscription not found'),
    ),
    RTE.flatMap((req) => {
      if (state !== req.state) {
        return pipe(
          updateActivationRequestState([req], state),
          RTE.map(() => ({ ...req, state })),
        );
      } else {
        return RTE.of(req);
      }
    }),
  );

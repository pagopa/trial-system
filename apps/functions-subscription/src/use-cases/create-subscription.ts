import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as RTE from 'fp-ts/ReaderTaskEither';
import {
  getSubscriptionById,
  makeSubscription,
  Subscription,
  UserId,
} from '../domain/subscription';
import { SubscriptionStoreError } from './errors';
import { ItemAlreadyExists, ItemNotFound } from '../domain/errors';
import {
  insertSubscription,
  enqueueSubscription,
} from '../domain/subscription';
import { getTrialById, TrialId } from '../domain/trial';
import { Tenant } from '../domain/users';

const handleMissingSubscription = (subscription: Subscription) =>
  pipe(
    enqueueSubscription(subscription),
    RTE.flatMap(() =>
      pipe(
        insertSubscription(subscription),
        RTE.mapLeft(() => new SubscriptionStoreError()),
      ),
    ),
  );

export const createSubscription = (
  tenant: Tenant,
  userId: UserId,
  trialId: TrialId,
  state: Extract<Subscription['state'], 'ACTIVE' | 'SUBSCRIBED'> = 'SUBSCRIBED',
) =>
  pipe(
    getTrialById(trialId, tenant),
    RTE.flatMapOption(
      (some) => some,
      () => new ItemNotFound('Trial not found'),
    ),
    RTE.flatMap(() => makeSubscription({ userId, trialId, state })),
    RTE.flatMap((subscription) =>
      pipe(
        getSubscriptionById(subscription.id),
        RTE.flatMap(
          O.fold(
            () => handleMissingSubscription(subscription),
            () =>
              RTE.left(new ItemAlreadyExists('Subscription already exists')),
          ),
        ),
      ),
    ),
  );

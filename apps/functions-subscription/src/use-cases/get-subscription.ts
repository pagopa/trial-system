import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import {
  UserId,
  makeSubscriptionId,
  getSubscriptionById,
} from '../domain/subscription';
import { ItemNotFound } from '../domain/errors';
import { TrialId } from '../domain/trial';

export const getSubscription = (userId: UserId, trialId: TrialId) =>
  pipe(
    makeSubscriptionId(trialId, userId),
    RTE.flatMap(getSubscriptionById),
    RTE.flatMapOption(
      (subscription) => subscription,
      () => new ItemNotFound('Subscription not found'),
    ),
  );

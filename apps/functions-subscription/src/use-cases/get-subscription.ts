import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import { TrialId, UserId, makeSubscriptionId } from '../domain/subscription';

// Maps all the requirements for this use-case
type Env = Pick<Capabilities, 'subscriptionReader' | 'hashFn'>;

export const getSubscription = (userId: UserId, trialId: TrialId) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('id', makeSubscriptionId(trialId, userId)),
    RTE.map(({ id, subscriptionReader }) => pipe(subscriptionReader.get(id))),
  );

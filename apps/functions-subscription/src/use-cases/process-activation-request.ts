import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import { ActivationRequest } from '../domain/activation-request';
import { makeSubscriptionHistoryNextVersion } from '../domain/subscription-history';
import { makeSubscriptionId } from '../domain/subscription';

type Env = Pick<
  Capabilities,
  'subscriptionHistoryWriter' | 'subscriptionHistoryReader'
>;

export const processActivationRequest = ({
  trialId,
  userId,
}: ActivationRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('subscriptionId', makeSubscriptionId(trialId, userId)),
    RTE.bindW(
      'subscriptionHistoryLatest',
      ({ subscriptionHistoryReader, subscriptionId }) =>
        pipe(
          subscriptionHistoryReader.getLatest({ subscriptionId }),
          TE.flatMapOption(
            (some) => some,
            () => new Error('Subscription History not found'),
          ),
          RTE.fromTaskEither,
        ),
    ),
    RTE.bindW(
      'subscriptionHistoryNewVersion',
      ({ subscriptionHistoryLatest }) =>
        makeSubscriptionHistoryNextVersion(subscriptionHistoryLatest, {
          state: 'ACTIVE',
        }),
    ),
    RTE.flatMapTaskEither(
      ({ subscriptionHistoryWriter, subscriptionHistoryNewVersion }) =>
        subscriptionHistoryWriter.insert(subscriptionHistoryNewVersion),
    ),
  );

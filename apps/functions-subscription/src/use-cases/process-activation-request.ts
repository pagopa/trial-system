import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import { ActivationRequest } from '../domain/activation-request';
import {
  insertSubscriptionHistory,
  makeSubscriptionHistoryNextVersion,
} from '../domain/subscription-history';
import { makeSubscriptionId } from '../domain/subscription';

type Env = Pick<
  Capabilities,
  'subscriptionHistoryWriter' | 'subscriptionHistoryReader'
>;

export const processActivationRequest = ({
  trialId,
  userId,
  activated,
}: ActivationRequest) => {
  if (activated)
    return pipe(
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
      RTE.flatMap(({ subscriptionHistoryLatest }) => {
        // only subscription in the SUBSCRIBED state can be activated
        if (subscriptionHistoryLatest.state === 'SUBSCRIBED')
          return pipe(
            makeSubscriptionHistoryNextVersion(subscriptionHistoryLatest, {
              state: 'ACTIVE',
            }),
            RTE.flatMap(insertSubscriptionHistory),
          );
        else return RTE.of(subscriptionHistoryLatest);
      }),
      RTE.map(O.of),
    );
  else return RTE.right(O.none);
};

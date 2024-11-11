import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { Subscription as SubscriptionAPI } from '../../../generated/definitions/internal/Subscription';
import { UserIdCodec } from '../../../domain/subscription';
import { SystemEnv } from '../../../system-env';
import { parsePathParameter, getAndValidateUser } from './middleware';
import { toHttpProblemJson } from './errors';
import { toSubscriptionAPI } from './codec';
import { TrialIdCodec } from '../../../domain/trial';

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<SubscriptionAPI>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Pick<SystemEnv, 'getSubscription'>
> = H.of((req: H.HttpRequest) => {
  return pipe(
    RTE.ask<Pick<SystemEnv, 'getSubscription'>>(),
    RTE.apSW(
      'tenant',
      RTE.fromEither(
        getAndValidateUser(['ApiTrialManager', 'ApiTrialUser'])(req),
      ),
    ),
    RTE.apSW(
      'userId',
      RTE.fromEither(parsePathParameter(UserIdCodec, 'userId')(req)),
    ),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(TrialIdCodec, 'trialId')(req)),
    ),
    RTE.flatMapTaskEither(({ getSubscription, trialId, userId, tenant }) =>
      getSubscription(tenant, userId, trialId),
    ),
    RTE.mapBoth(toHttpProblemJson, flow(toSubscriptionAPI, H.successJson)),
    RTE.orElseW(RTE.of),
  );
});

export const makeGetSubscriptionHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

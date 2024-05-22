import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { Subscription as SubscriptionAPI } from '../../../generated/definitions/internal/Subscription';
import { UserId, TrialId } from '../../../domain/subscription';
import { SystemEnv } from '../../../system-env';
import { parsePathParameter } from './middleware';
import { toHttpProblemJson } from './errors';
import { toSubscriptionAPI } from './codec';

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<SubscriptionAPI>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Pick<SystemEnv, 'getSubscription'>
> = H.of((req: H.HttpRequest) => {
  return pipe(
    RTE.ask<Pick<SystemEnv, 'getSubscription'>>(),
    RTE.apSW(
      'userId',
      RTE.fromEither(parsePathParameter(NonEmptyString, 'userId')(req)),
    ),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(NonEmptyString, 'trialId')(req)),
    ),
    RTE.flatMapTaskEither(({ getSubscription, trialId, userId }) =>
      getSubscription(
        userId as unknown as UserId,
        trialId as unknown as TrialId,
      ),
    ),
    RTE.mapBoth(toHttpProblemJson, flow(toSubscriptionAPI, H.successJson)),
    RTE.orElseW(RTE.of),
  );
});

export const makeGetSubscriptionHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

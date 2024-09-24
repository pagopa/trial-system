import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { UserIdCodec } from '../../../domain/subscription';
import { SystemEnv } from '../../../system-env';
import {
  parsePathParameter,
  parseRequestBody,
  verifyUserGroup,
} from './middleware';
import { toHttpProblemJson } from './errors';
import { toUpdatedSubscription } from './codec';
import { TrialIdCodec } from '../../../domain/trial';
import { UpdatedSubscription } from '../../../generated/definitions/internal/UpdatedSubscription';
import { UpdateSubscription } from '../../../generated/definitions/internal/UpdateSubscription';

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<UpdatedSubscription, 202>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Pick<SystemEnv, 'updateSubscription'>
> = H.of((req: H.HttpRequest) => {
  return pipe(
    RTE.ask<Pick<SystemEnv, 'updateSubscription'>>(),
    RTE.apFirst(RTE.fromEither(verifyUserGroup(['ApiTrialManager'])(req))),
    RTE.apSW(
      'userId',
      RTE.fromEither(parsePathParameter(UserIdCodec, 'userId')(req)),
    ),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(TrialIdCodec, 'trialId')(req)),
    ),
    RTE.apSW(
      'requestBody',
      RTE.fromEither(parseRequestBody(UpdateSubscription)(req)),
    ),
    RTE.flatMapTaskEither(
      ({ updateSubscription, trialId, userId, requestBody }) =>
        updateSubscription(userId, trialId, requestBody.state),
    ),
    RTE.mapBoth(
      toHttpProblemJson,
      flow(toUpdatedSubscription, H.successJson, H.withStatusCode(202)),
    ),
    RTE.orElseW(RTE.of),
  );
});

export const makePutSubscriptionHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

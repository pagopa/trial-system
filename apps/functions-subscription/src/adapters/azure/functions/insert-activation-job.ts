import * as H from '@pagopa/handler-kit';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { flow, pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { SystemEnv } from '../../../system-env';
import { CreateActivationJob } from '../../../generated/definitions/internal/CreateActivationJob';
import { parsePathParameter, parseRequestBody } from './middleware';
import { TrialIdCodec } from '../../../domain/subscription';
import { NonNegativeNumber } from '@pagopa/ts-commons/lib/numbers';
import { toHttpProblemJson } from './errors';

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<unknown, 202>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Pick<SystemEnv, 'insertActivationJob'>
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Pick<SystemEnv, 'insertActivationJob'>>(),
    RTE.apSW(
      'requestBody',
      RTE.fromEither(parseRequestBody(CreateActivationJob)(req)),
    ),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(TrialIdCodec, 'trialId')(req)),
    ),
    RTE.flatMapTaskEither(
      ({ insertActivationJob, trialId, requestBody: { usersToActivate } }) =>
        insertActivationJob({
          trialId,
          usersToActivate: usersToActivate as NonNegativeNumber,
        }),
    ),
    RTE.map(flow(H.successJson, H.withStatusCode(202))),
    RTE.mapLeft(toHttpProblemJson),
    RTE.orElseW(RTE.of),
  ),
);

export const makePostActivationJobHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

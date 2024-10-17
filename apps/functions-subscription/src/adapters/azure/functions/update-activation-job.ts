import * as H from '@pagopa/handler-kit';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { flow, pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { SystemEnv } from '../../../system-env';
import { UpdateActivationJob } from '../../../generated/definitions/internal/UpdateActivationJob';
import { ActivationJob as ActivationJobAPI } from '../../../generated/definitions/internal/ActivationJob';
import {
  parsePathParameter,
  parseRequestBody,
  getAndValidateUser,
} from './middleware';
import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';
import { toHttpProblemJson } from './errors';
import { toActivationJobAPI } from './codec';
import { TrialIdCodec } from '../../../domain/trial';

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<ActivationJobAPI, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Pick<SystemEnv, 'updateActivationJob'>
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Pick<SystemEnv, 'updateActivationJob'>>(),
    RTE.apFirst(RTE.fromEither(getAndValidateUser(['ApiTrialManager'])(req))),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(TrialIdCodec, 'trialId')(req)),
    ),
    RTE.apSW(
      'requestBody',
      RTE.fromEither(parseRequestBody(UpdateActivationJob)(req)),
    ),
    RTE.flatMapTaskEither(({ updateActivationJob, trialId, requestBody }) =>
      updateActivationJob(trialId, {
        usersToActivate: requestBody.usersToActivate as NonNegativeInteger,
      }),
    ),
    RTE.mapBoth(toHttpProblemJson, flow(toActivationJobAPI, H.successJson)),
    RTE.orElseW(RTE.of),
  ),
);

export const makePutActivationJobHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

import * as H from '@pagopa/handler-kit';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { flow, pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { SystemEnv } from '../../../system-env';
import { getAndValidateUser, parsePathParameter } from './middleware';
import { toHttpProblemJson } from './errors';
import { ActivationJob as ActivationJobAPI } from '../../../generated/definitions/internal/ActivationJob';
import { ItemNotFound } from '../../../domain/errors';
import { toActivationJobAPI } from './codec';
import { TrialIdCodec } from '../../../domain/trial';

type Env = Pick<SystemEnv, 'getActivationJob'>;

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<ActivationJobAPI>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Env
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW(
      'tenant',
      RTE.fromEither(getAndValidateUser(['ApiTrialManager'])(req)),
    ),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(TrialIdCodec, 'trialId')(req)),
    ),
    RTE.flatMapTaskEither(({ tenant, trialId, getActivationJob }) =>
      getActivationJob(tenant, trialId),
    ),
    RTE.flatMapOption(
      (job) => job,
      () => new ItemNotFound('Activation job not found'),
    ),
    RTE.mapBoth(toHttpProblemJson, flow(toActivationJobAPI, H.successJson)),
    RTE.orElseW(RTE.of),
  ),
);

export const makeGetActivationJobHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

import { flow, pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as H from '@pagopa/handler-kit';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { toHttpProblemJson } from './errors';
import { SystemEnv } from '../../../system-env';
import { getAndValidateUser, parseRequestBody } from './middleware';
import { CreateTrial } from '../../../generated/definitions/internal/CreateTrial';
import { toTrialAPI } from './codec';
import { Trial as TrialAPI } from '../../../generated/definitions/internal/Trial';

type Env = Pick<SystemEnv, 'createTrial'>;

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<TrialAPI, 202>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Env
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apFirst(RTE.fromEither(getAndValidateUser(['ApiTrialManager'])(req))),
    RTE.apSW('requestBody', RTE.fromEither(parseRequestBody(CreateTrial)(req))),
    RTE.flatMapTaskEither(
      ({ requestBody: { name, description }, createTrial }) =>
        createTrial(name, description),
    ),
    RTE.mapBoth(
      toHttpProblemJson,
      flow(toTrialAPI, H.successJson, H.withStatusCode(202)),
    ),
    RTE.orElseW(RTE.of),
  ),
);

export const makePostTrialHandler = httpAzureFunction(makeHandlerKitHandler);

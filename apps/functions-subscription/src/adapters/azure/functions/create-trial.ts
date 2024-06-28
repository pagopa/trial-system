import { flow, pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as H from '@pagopa/handler-kit';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { toHttpProblemJson } from './errors';
import { SystemEnv } from '../../../system-env';
import { parseRequestBody } from './middleware';
import { CreateTrial } from '../../../generated/definitions/internal/CreateTrial';
import { toCreatedTrialAPI } from './codec';
import { CreatedTrial as CreatedTrialAPI } from '../../../generated/definitions/internal/CreatedTrial';

type Env = Pick<SystemEnv, 'createTrial'>;

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<CreatedTrialAPI, 202>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Env
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('requestBody', RTE.fromEither(parseRequestBody(CreateTrial)(req))),
    RTE.flatMapTaskEither(
      ({ requestBody: { name, description }, createTrial }) =>
        createTrial(name, description),
    ),
    RTE.mapBoth(
      toHttpProblemJson,
      flow(toCreatedTrialAPI, H.successJson, H.withStatusCode(202)),
    ),
    RTE.orElseW(RTE.of),
  ),
);

export const makePostTrialHandler = httpAzureFunction(makeHandlerKitHandler);

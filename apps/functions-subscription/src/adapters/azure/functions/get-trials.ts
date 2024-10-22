import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { Trial as TrialAPI } from '../../../generated/definitions/internal/Trial';
import { SystemEnv } from '../../../system-env';
import { getAndValidateUser } from './middleware';
import { toHttpProblemJson } from './errors';
import { toTrialAPIArray } from './codec';

type Env = Pick<SystemEnv, 'getTrials'>;

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<readonly TrialAPI[]>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Env
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apFirst(RTE.fromEither(getAndValidateUser(['ApiTrialSupport'])(req))),
    RTE.flatMapTaskEither(({ getTrials }) => getTrials()),
    RTE.mapBoth(toHttpProblemJson, flow(toTrialAPIArray, H.successJson)),
    RTE.orElseW(RTE.of),
  ),
);

export const makeGetTrialsHandler = httpAzureFunction(makeHandlerKitHandler);

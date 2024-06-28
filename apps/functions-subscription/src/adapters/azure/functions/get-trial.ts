import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { Trial as TrialAPI } from '../../../generated/definitions/internal/Trial';
import { SystemEnv } from '../../../system-env';
import { parsePathParameter } from './middleware';
import { toHttpProblemJson } from './errors';
import { toTrialAPI } from './codec';
import { TrialIdCodec } from '../../../domain/trial';
import { ItemNotFound } from '../../../domain/errors';

type Env = Pick<SystemEnv, 'getTrial'>;

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<TrialAPI>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Env
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(TrialIdCodec, 'trialId')(req)),
    ),
    RTE.flatMapTaskEither(({ getTrial, trialId }) => getTrial(trialId)),
    RTE.flatMapOption(
      (trial) => trial,
      () => new ItemNotFound('Trial not found'),
    ),
    RTE.mapBoth(toHttpProblemJson, flow(toTrialAPI, H.successJson)),
    RTE.orElseW(RTE.of),
  ),
);

export const makeGetTrialHandler = httpAzureFunction(makeHandlerKitHandler);

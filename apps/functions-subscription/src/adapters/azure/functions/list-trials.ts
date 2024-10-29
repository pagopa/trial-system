import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { Trial as TrialAPI } from '../../../generated/definitions/internal/Trial';
import { SystemEnv } from '../../../system-env';
import { getAndValidateUser, parseQueryParameter } from './middleware';
import { toHttpProblemJson } from './errors';
import { toTrialAPI } from './codec';
import { TrialIdCodec } from '../../../domain/trial';
import { NumberFromString } from '@pagopa/ts-commons/lib/numbers';

type Env = Pick<SystemEnv, 'listTrials'>;

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<readonly TrialAPI[]>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Env
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apFirst(RTE.fromEither(getAndValidateUser(['ApiTrialSupport'])(req))),
    RTE.apSW(
      'pageSize',
      RTE.fromEither(parseQueryParameter(NumberFromString, 'pageSize')(req)),
    ),
    RTE.apSW(
      'maximumId',
      RTE.fromEither(parseQueryParameter(TrialIdCodec, 'maximumId')(req)),
    ),
    RTE.apSW(
      'minimumId',
      RTE.fromEither(parseQueryParameter(TrialIdCodec, 'minimumId')(req)),
    ),
    RTE.flatMapTaskEither(({ listTrials, pageSize, maximumId, minimumId }) =>
      listTrials(pageSize, maximumId, minimumId),
    ),
    RTE.mapBoth(
      toHttpProblemJson,
      flow((a) => a.map(toTrialAPI), H.successJson),
    ),
    RTE.orElseW(RTE.of),
  ),
);

export const makeListTrialsHandler = httpAzureFunction(makeHandlerKitHandler);

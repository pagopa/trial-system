import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { TrialPaginatedCollection } from '../../../generated/definitions/internal/TrialPaginatedCollection';
import { SystemEnv } from '../../../system-env';
import { getAndValidateUser, parseQueryParameter } from './middleware';
import { toHttpProblemJson } from './errors';
import { toTrialListAPI } from './codec';
import { TrialIdCodec } from '../../../domain/trial';
import {
  IntegerFromString,
  WithinRangeInteger,
} from '@pagopa/ts-commons/lib/numbers';

type Env = Pick<SystemEnv, 'listTrials'>;

export const QueryPageSize = t.union([
  t.undefined,
  // validates the pageSize value according to the OpenAPI specification
  IntegerFromString.pipe(WithinRangeInteger(1, 101)),
]);

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<TrialPaginatedCollection>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Env
> = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apFirst(RTE.fromEither(getAndValidateUser(['ApiTrialSupport'])(req))),
    RTE.apSW(
      'pageSize',
      pipe(
        parseQueryParameter(QueryPageSize, 'pageSize')(req),
        // set a default pageSize (as specified in the OpenAPI specification)
        // if the value received from the request is null or undefined
        E.map(O.fromNullable),
        E.map(O.getOrElse(() => 25)),
        RTE.fromEither,
      ),
    ),
    RTE.apSW(
      'maximumId',
      RTE.fromEither(
        parseQueryParameter(
          t.union([TrialIdCodec, t.undefined]),
          'maximumId',
        )(req),
      ),
    ),
    RTE.apSW(
      'minimumId',
      RTE.fromEither(
        parseQueryParameter(
          t.union([TrialIdCodec, t.undefined]),
          'minimumId',
        )(req),
      ),
    ),
    RTE.flatMapTaskEither(({ listTrials, pageSize, maximumId, minimumId }) =>
      listTrials({ pageSize, maximumId, minimumId }),
    ),
    RTE.mapBoth(toHttpProblemJson, flow(toTrialListAPI, H.successJson)),
    RTE.orElseW(RTE.of),
  ),
);

export const makeListTrialsHandler = httpAzureFunction(makeHandlerKitHandler);

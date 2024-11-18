import * as H from '@pagopa/handler-kit';
import { pipe, flow } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
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
import { withDefault } from '@pagopa/ts-commons/lib/types';

type Env = Pick<SystemEnv, 'listTrials'>;

const QueryPageSizeBase = IntegerFromString.pipe(WithinRangeInteger(1, 100));

export const QueryPageSize = withDefault(
  QueryPageSizeBase,
  25 as t.TypeOf<typeof QueryPageSizeBase>,
);

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
      RTE.fromEither(
        parseQueryParameter(
          QueryPageSize,
          'pageSize',
        )(req),
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

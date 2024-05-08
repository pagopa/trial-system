import { pipe } from 'fp-ts/lib/function';
import * as H from '@pagopa/handler-kit';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as T from "fp-ts/Task"

import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { ApplicationInfo } from '../generated/definitions/internal/ApplicationInfo';
import { AzureCosmosProblemSource, makeAzureCosmosDbHealthCheck } from '../utils/cosmos/health-check';
import { HealthProblem } from '@pagopa/io-functions-commons/dist/src/utils/healthcheck';
import { CosmosDBDependency } from '../utils/cosmos/dependency';
import { HealthCheckBuilder } from '../utils/health-check';

type ProblemSource = AzureCosmosProblemSource;
const applicativeValidation = RTE.getApplicativeReaderTaskValidation(
  T.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

export const makeInfoHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<ApplicationInfo, 200>,
  CosmosDBDependency
> = H.of((_: H.HttpRequest) =>
  pipe(
    // TODO: Add all the function health checks
    [makeAzureCosmosDbHealthCheck] as ReadonlyArray<
      HealthCheckBuilder
    >,
    RA.sequence(applicativeValidation),
    RTE.map(() => H.successJson({ message: "it works!" })),
    RTE.mapLeft(problems => new H.HttpError(problems.join("\n\n")))
  )
);

export const InfoFunction = httpAzureFunction(makeInfoHandler);
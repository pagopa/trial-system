import { pipe } from 'fp-ts/lib/function';
import * as H from '@pagopa/handler-kit';
import * as RA from 'fp-ts/ReadonlyArray';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { CosmosClient } from '@azure/cosmos';
import { EventHubProducerClient } from '@azure/event-hubs';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { ApplicationInfo } from '../../../generated/definitions/internal/ApplicationInfo';
import {
  HealthProblem,
  toHealthProblems,
} from '@pagopa/io-functions-commons/dist/src/utils/healthcheck';

export interface InfoEnv {
  readonly cosmosDB: CosmosClient;
  readonly subscriptionRequestEventHub: EventHubProducerClient;
}

const cosmosHealthCheck = pipe(
  RTE.ask<InfoEnv>(),
  RTE.flatMapTaskEither(({ cosmosDB }) =>
    pipe(
      TE.tryCatch(
        () => cosmosDB.getDatabaseAccount(),
        toHealthProblems('CosmosDB' as const),
      ),
      TE.map(() => true),
    ),
  ),
);

const eventHubHealthCheck = pipe(
  RTE.ask<InfoEnv>(),
  RTE.flatMapTaskEither(({ subscriptionRequestEventHub }) =>
    pipe(
      TE.tryCatch(
        () => subscriptionRequestEventHub.getEventHubProperties(),
        toHealthProblems('Subscription Request EventHub' as const),
      ),
      TE.map(() => true),
    ),
  ),
);

const ApplicativeParAccumulateErrors = RTE.getApplicativeReaderTaskValidation(
  T.ApplicativePar,
  RA.getSemigroup<HealthProblem<string>>(),
);

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<ApplicationInfo>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  InfoEnv
> = H.of((req: H.HttpRequest) =>
  pipe(
    [cosmosHealthCheck, eventHubHealthCheck],
    RA.sequence(ApplicativeParAccumulateErrors),
    RTE.map(() => H.successJson({ message: `Pong from ${req.url}` })),
    RTE.mapLeft((errors) => new H.HttpError(errors.join('\n'))),
    RTE.orElseW((error) => pipe(error, H.toProblemJson, H.problemJson, RTE.of)),
  ),
);

export const makeInfoHandler = httpAzureFunction(makeHandlerKitHandler);

import { pipe } from 'fp-ts/lib/function';
import * as H from '@pagopa/handler-kit';
import * as RTE from 'fp-ts/ReaderTaskEither';

import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { ApplicationInfo } from '../generated/definitions/internal/ApplicationInfo';

const makeInfoHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<ApplicationInfo>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>
> = H.of((req: H.HttpRequest) =>
  pipe(
    // TODO: Add all the function health checks
    RTE.right(void 0),
    RTE.map(() => H.successJson({ message: `Pong from ${req.url}` })),
    RTE.mapLeft(() => new H.HttpError('Function subscription not working!')),
  ),
);

export const InfoFunction = httpAzureFunction(makeInfoHandler);

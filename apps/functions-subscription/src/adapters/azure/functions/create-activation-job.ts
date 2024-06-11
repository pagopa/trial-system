import * as H from '@pagopa/handler-kit';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { flow, pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { SystemEnv } from '../../../system-env';

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<string> | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  SystemEnv
> = H.of(() =>
  pipe(
    // FIXME: Fix implementation
    RTE.of('Hello world!'),
    RTE.map(H.success),
    RTE.orElseW(flow(H.toProblemJson, H.problemJson, RTE.right)),
  ),
);

export const makeCreateActivationJobHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

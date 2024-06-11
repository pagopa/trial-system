import * as H from '@pagopa/handler-kit';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { flow, pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';

const makeHandlerKitHandler = H.of(() =>
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

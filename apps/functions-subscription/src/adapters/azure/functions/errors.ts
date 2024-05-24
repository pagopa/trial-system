import { ItemAlreadyExists, ItemNotFound } from '../../../domain/errors';
import { pipe } from 'fp-ts/function';
import * as H from '@pagopa/handler-kit';

export const toHttpProblemJson = (err: Error) => {
  if (err instanceof ItemNotFound) {
    // ItemNotFound -> 404 HTTP
    return pipe(
      new H.HttpNotFoundError(err.message),
      H.toProblemJson,
      H.problemJson,
      H.withStatusCode(404),
    );
  } else if (err instanceof ItemAlreadyExists) {
    // ItemAlreadyExists -> 409 HTTP
    return pipe(
      new H.HttpConflictError(err.message),
      H.toProblemJson,
      H.problemJson,
      H.withStatusCode(409),
    );
  } else {
    // Everything else -> 500 HTTP
    return pipe(err, H.toProblemJson, H.problemJson);
  }
};

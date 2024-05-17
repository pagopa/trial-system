import { Decoder } from 'io-ts';
import * as H from '@pagopa/handler-kit';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

export const parseRequestBody =
  <T>(schema: Decoder<unknown, T>) =>
  (req: H.HttpRequest) =>
    pipe(
      req.body,
      H.parse(schema, 'Missing or invalid body'),
      E.mapLeft(({ message }) => new H.HttpBadRequestError(message)),
    );

export const parsePathParameter =
  <T>(schema: Decoder<unknown, T>) =>
  (paramName: string) =>
  (req: H.HttpRequest) =>
    pipe(
      req.path[paramName],
      H.parse(schema, `Invalid format of ${paramName} parameter`),
      E.mapLeft(({ message }) => new H.HttpBadRequestError(message)),
    );

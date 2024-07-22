import * as t from 'io-ts';
import { Decoder } from 'io-ts';
import * as H from '@pagopa/handler-kit';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

/**
 * Parses the request body using a specified schema and validates it.
 *
 * This function takes a JSON schema decoder and an HTTP request, then attempts to
 * parse and validate the request body against the schema.
 * If the validation fails, it returns an {@link H.HttpBadRequestError} with an
 * appropriate message.
 */
export const parseRequestBody =
  <T>(schema: Decoder<unknown, T>) =>
  (req: H.HttpRequest) =>
    pipe(
      req.body,
      H.parse(schema, 'Missing or invalid body'),
      E.mapLeft(({ message }) => new H.HttpBadRequestError(message)),
    );

/**
 * Parses a specific path parameter of an HTTP request using the provided schema.
 */
export const parsePathParameter =
  <T>(schema: Decoder<unknown, T>, paramName: string) =>
  (req: H.HttpRequest) =>
    pipe(
      req.path[paramName],
      H.parse(schema, `Invalid format of ${paramName} parameter`),
      E.mapLeft(({ message }) => new H.HttpBadRequestError(message)),
    );

/**
 * Parses a specific header parameter of an HTTP request using the provided schema.
 */
export const parseHeaderParameter =
  <T>(schema: Decoder<unknown, T>, headerName: string) =>
  (req: H.HttpRequest) =>
    pipe(
      req.headers[headerName],
      H.parse(schema, `Invalid format of ${headerName} header`),
      E.mapLeft(({ message }) => new H.HttpBadRequestError(message)),
    );

/**
 * Checks if the given group is contained in the groups provided in the
 * x-user-groups header.
 */
export const verifyUserGroup = (group: string) => (req: H.HttpRequest) =>
  pipe(
    parseHeaderParameter(t.string, 'x-user-groups')(req),
    E.mapLeft(
      () => new H.HttpForbiddenError(`Missing required groups: ${group}`),
    ),
    E.filterOrElse(
      (stringGroups) => stringGroups.split(',').includes(group),
      () => new H.HttpForbiddenError(`Missing required groups: ${group}`),
    ),
  );

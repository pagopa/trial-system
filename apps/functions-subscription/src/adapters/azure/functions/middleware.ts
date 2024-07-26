import * as t from 'io-ts';
import { Decoder } from 'io-ts';
import * as H from '@pagopa/handler-kit';
import { flow, pipe } from 'fp-ts/function';
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
 * Verifies the presence of the `x-user-groups` header and checks if it includes
 * the specified group. If the `x-user-groups` header is missing,
 * `verifyUserGroup` permits the request as if the group were included in the
 * header.
 */
export const verifyUserGroup = (group: string) => (req: H.HttpRequest) =>
  pipe(
    req.headers['x-user-groups'],
    E.fromNullable(void 0),
    E.foldW(
      E.right,
      flow(
        H.parse(t.string, `Invalid format of 'x-user-groups' header`),
        E.mapLeft(
          () => new H.HttpForbiddenError(`Missing required group: ${group}`),
        ),
        E.filterOrElse(
          (stringGroups) => stringGroups.split(',').includes(group),
          () => new H.HttpForbiddenError(`Missing required group: ${group}`),
        ),
        E.map(() => void 0),
      ),
    ),
  );

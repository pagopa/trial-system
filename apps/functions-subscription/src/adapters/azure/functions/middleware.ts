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

type AllowedGroup = 'ApiTrialUser' | 'ApiTrialManager';
/**
 * Verifies the presence of the `x-user-groups` header and checks if it includes
 * at least one of the specified groups. If the `x-user-groups` header is missing,
 * `verifyUserGroup` permits the request as if the group were included in the
 * header.
 */
export const verifyUserGroup =
  (allowedGroups: readonly AllowedGroup[]) => (req: H.HttpRequest) =>
    pipe(
      req.headers['x-user-groups'],
      E.fromNullable(void 0),
      E.foldW(
        // if x-user-groups does not exist behave like it were included
        E.right,
        // if exists then verify if it is included
        flow(
          H.parse(t.string, `Invalid format of 'x-user-groups' header`),
          E.map((stringGroups) => stringGroups.split(',')),
          E.filterOrElseW(
            (headerGroups) =>
              allowedGroups.some((allowedGroup) =>
                headerGroups.includes(allowedGroup),
              ),
            () =>
              new H.HttpForbiddenError(
                `Missing required group: ${allowedGroups}`,
              ),
          ),
          E.map(() => void 0),
        ),
      ),
    );

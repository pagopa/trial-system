/**
 * Config module
 *
 * Single point of access for the application configuration. Handles validation on required environment variables.
 * The configuration is evaluated eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */
import * as t from 'io-ts';

import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as reporters from '@pagopa/ts-commons/lib/reporters';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

// ----------------------------
// Global app configuration
// ----------------------------
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.type({
  COSMOS_CONNECTION_STRING: NonEmptyString,
  COSMOS_DB_NAME: NonEmptyString,

  isProduction: t.boolean,
});

export const envConfig = {
  ...process.env,
  isProduction: process.env.NODE_ENV === 'production',
};

const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evaluated when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors: readonly t.ValidationError[]) => {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(
        `Invalid configuration: ${reporters.readableReportSimplified(errors)}`,
      );
    }),
  );

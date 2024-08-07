import { readableReportSimplified } from '@pagopa/ts-commons/lib/reporters';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';

export const parseConfigOrThrow = <A, O>(
  configType: t.Type<A, O>,
  environment: Record<string, string | undefined>,
) =>
  pipe(
    environment,
    configType.decode,
    E.getOrElseW((errs) => {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(readableReportSimplified(errs));
    }),
  );

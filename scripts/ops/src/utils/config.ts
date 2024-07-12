import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as t from "io-ts";

export const getConfigOrThrow = <A, O>(
  configType: t.Type<A, O>,
  environment: { [name: string]: string } | NodeJS.ProcessEnv
) =>
  pipe(
    environment,
    configType.decode,
    E.getOrElseW(errs => {
      throw new Error(readableReportSimplified(errs));
    })
  );

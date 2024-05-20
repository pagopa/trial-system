import {
  HealthCheck,
  ProblemSource,
} from '@pagopa/io-functions-commons/dist/src/utils/healthcheck';

export type HealthCheckBuilder = <T, P, S extends ProblemSource<P>>(
  dependency: T,
) => HealthCheck<S>;

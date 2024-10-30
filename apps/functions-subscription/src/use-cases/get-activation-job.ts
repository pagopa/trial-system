import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { getTrialById } from '../domain/trial';
import { ItemNotFound } from '../domain/errors';
import {
  ActivationJob,
  getActivationJob as getTrialActivationJob,
} from '../domain/activation-job';
import { Tenant } from '../domain/users';

export const getActivationJob = (
  tenant: Tenant,
  trialId: ActivationJob['trialId'],
) =>
  pipe(
    getTrialById(trialId, tenant),
    RTE.flatMapOption(
      (trial) => trial,
      () => new ItemNotFound('Activation job not found'),
    ),
    RTE.flatMap(({ id }) => getTrialActivationJob(id)),
  );

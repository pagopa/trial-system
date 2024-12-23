import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { getTrialIdByTenant } from '../domain/trial';
import { ItemNotFound } from '../domain/errors';
import {
  ActivationJob,
  updateActivationJob as updateJob,
} from '../domain/activation-job';
import { Tenant } from '../domain/users';

export const updateActivationJob = (
  tenant: Tenant,
  trialId: ActivationJob['trialId'],
  update: Pick<ActivationJob, 'usersToActivate'>,
) =>
  pipe(
    getTrialIdByTenant(trialId, tenant),
    RTE.mapLeft(() => new ItemNotFound('Activation job not found')),
    RTE.flatMap((id) => updateJob(id, update)),
  );

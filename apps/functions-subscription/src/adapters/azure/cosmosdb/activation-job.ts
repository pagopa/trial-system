import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { Database } from '@azure/cosmos';
import {
  ActivationJobCodec,
  ActivationJobReader,
  ActivationJobWriter,
} from '../../../domain/activation-job';
import { cosmosErrorToDomainError } from './errors';
import { decodeFromItem } from './decode';

export const makeActivationJobCosmosContainer = (
  db: Database,
  containerName: string,
): ActivationJobReader & ActivationJobWriter => {
  const container = db.container(containerName);
  return {
    get: (id) =>
      pipe(
        TE.tryCatch(() => container.item(id, id).read(), E.toError),
        TE.flatMapEither(decodeFromItem(ActivationJobCodec)),
        TE.mapLeft(cosmosErrorToDomainError),
      ),
    insert: (job) =>
      pipe(
        TE.tryCatch(
          () => container.items.create({ ...job, id: job.trialId }),
          E.toError,
        ),
        TE.mapBoth(cosmosErrorToDomainError, () => job),
      ),
    update: (trialId, update) =>
      pipe(
        TE.tryCatch(
          () =>
            container.item(trialId, trialId).patch([
              {
                op: 'replace',
                path: '/usersToActivate',
                value: update.usersToActivate,
              },
            ]),
          E.toError,
        ),
        TE.flatMapEither(decodeFromItem(ActivationJobCodec)),
        TE.flatMapOption(
          (result) => result,
          () => new Error('Error during ActivationJob update'),
        ),
        TE.mapLeft(cosmosErrorToDomainError),
      ),
  };
};

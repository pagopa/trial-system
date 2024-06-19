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
): ActivationJobReader & ActivationJobWriter => {
  const container = db.container('activations');
  return {
    get: (id) =>
      pipe(
        TE.tryCatch(() => container.item(id, id).read(), E.toError),
        TE.flatMapEither(decodeFromItem(ActivationJobCodec)),
      ),
    insert: (job) =>
      pipe(
        TE.tryCatch(
          () => container.items.create({ ...job, id: job.trialId }),
          E.toError,
        ),
        TE.mapBoth(cosmosErrorToDomainError, () => job),
      ),
  };
};

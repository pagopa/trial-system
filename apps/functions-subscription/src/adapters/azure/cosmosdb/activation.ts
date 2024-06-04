import * as TE from 'fp-ts/TaskEither';
import { Database } from '@azure/cosmos';
import { ActivationService } from '../../../domain/activation';

export const makeActivationCosmosContainer = (
  db: Database,
): ActivationService => {
  // TODO: Complete implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const container = db.container('activations');
  return {
    fetchActivationRequests: () => TE.of([]),
    activateSubscription: (activationRequest) => TE.of(activationRequest),
  };
};

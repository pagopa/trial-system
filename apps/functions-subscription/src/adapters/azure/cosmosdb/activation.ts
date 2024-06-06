import * as TE from 'fp-ts/TaskEither';
import { Database } from '@azure/cosmos';
import { ActivationService } from '../../../domain/activation';

export const makeActivationCosmosContainer = (
  db: Database,
): ActivationService => {
  // TODO: Complete implementation

  const container = db.container('activations');
  return {
    fetchActivationRequestsToActivate: () => TE.of([]),
    activateActivationRequests: (activationRequests) => TE.right('ok'),
  };
};

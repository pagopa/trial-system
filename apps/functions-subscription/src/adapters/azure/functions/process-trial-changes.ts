import { InvocationContext } from '@azure/functions';
import { Capabilities } from '../../../domain/capabilities';

export const makeTrialChangesHandler =
  (env: Pick<Capabilities, 'trialWriter'>) =>
  (
    documents: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: InvocationContext,
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ): Promise<readonly void[]> =>
    Promise.resolve([]);

import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { TrialIdCodec, UserIdCodec } from './subscription';
import { NonNegativeNumber } from '@pagopa/ts-commons/lib/numbers';

export const ActivationRequestCodec = t.strict({
  id: t.string,
  userId: UserIdCodec,
  trialId: TrialIdCodec,
  createdAt: IsoDateFromString,
  type: t.literal('request'),
  activated: t.boolean,
});
type ActivationRequest = t.TypeOf<typeof ActivationRequestCodec>;

const ActivationJobCodec = t.strict({
  trialId: TrialIdCodec,
  createdAt: IsoDateFromString,
  usersToActivate: NonNegativeNumber,
  usersActivated: NonNegativeNumber,
  type: t.literal('job'),
});
type ActivationJob = t.TypeOf<typeof ActivationJobCodec>;

export const ActivationCodec = t.union([
  ActivationRequestCodec,
  ActivationJobCodec,
]);

export interface ActivationJobRequest {
  readonly usersToActivate: ActivationJob['usersToActivate'];
  readonly usersActivated: ActivationJob['usersActivated'];
  readonly trialId: ActivationJob['trialId'];
}

export interface ActivationService {
  /**
   * This function returns a list of activation requests that are going to be
   * activated.
   * The input is an object representing the trialId of the requests to enable and
   * the number of activation requests to activate.
   */
  readonly fetchActivationRequestsToActivate: (
    filter: ActivationJobRequest,
  ) => TE.TaskEither<Error, readonly ActivationRequest[]>;

  /**
   * This function is responsible to activate the activation requests.
   * The input is a list of activation requests that are going to be activated.
   * If any of the activation request cannot be activated, then none of them
   * are activated.
   */
  readonly activateActivationRequests: (
    activationRequests: readonly ActivationRequest[],
  ) => TE.TaskEither<Error, 'ok' | 'ko'>; // FIXME: Create a Result object
}

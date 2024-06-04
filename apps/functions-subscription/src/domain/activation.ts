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
  isActive: t.boolean,
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
export type Activation = t.TypeOf<typeof ActivationCodec>;

interface ActivationFilter {
  readonly usersToActivate: ActivationJob['usersToActivate'];
  readonly trialId: ActivationJob['trialId'];
  readonly isActive: boolean;
}

export interface ActivationService {
  readonly fetchActivationRequests: (
    filter: ActivationFilter,
  ) => TE.TaskEither<Error, readonly ActivationRequest[]>;

  readonly activateSubscription: (
    activationRequest: ActivationRequest,
  ) => TE.TaskEither<Error, ActivationRequest>;
}

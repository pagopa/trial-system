import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { TrialIdCodec, UserIdCodec } from './subscription';
import { NonNegativeNumber } from '@pagopa/ts-commons/lib/numbers';

export const BaseCosmosDbDocument = t.strict({
  id: t.string,
  trialId: TrialIdCodec,
  _etag: t.string,
});
export type BaseCosmosDbDocument = t.TypeOf<typeof BaseCosmosDbDocument>;

export const ActivationRequestCodec = t.intersection([
  BaseCosmosDbDocument,
  t.strict({
    userId: UserIdCodec,
    createdAt: IsoDateFromString,
    type: t.literal('request'),
    activated: t.boolean,
  }),
]);
export type ActivationRequest = t.TypeOf<typeof ActivationRequestCodec>;

const ActivationJobCodec = t.intersection([
  BaseCosmosDbDocument,
  t.strict({
    createdAt: IsoDateFromString,
    usersToActivate: NonNegativeNumber,
    usersActivated: NonNegativeNumber,
    type: t.literal('job'),
  }),
]);
export type ActivationJob = t.TypeOf<typeof ActivationJobCodec>;

export const ActivationCodec = t.union([
  ActivationRequestCodec,
  ActivationJobCodec,
]);

type ActivationResult =
  | {
      readonly status: 'ok';
      readonly activated: number;
    }
  | {
      readonly status: 'ko';
      readonly activated: 0;
    };

export interface ActivationService {
  /**
   * This function returns a list of activation requests that are going to be
   * activated.
   * The input is an object representing the trialId of the requests to enable and
   * the number of activation requests to activate.
   */
  readonly fetchActivationRequestsToActivate: (
    filter: ActivationJob,
  ) => TE.TaskEither<Error, readonly ActivationRequest[]>;

  /**
   * This function is responsible to activate the activation requests.
   * The input is a list of activation requests that are going to be activated.
   * If any of the activation request cannot be activated, then none of them
   * are activated.
   */
  readonly activateActivationRequests: (
    activationJob: ActivationJob,
  ) => (
    activationRequests: readonly ActivationRequest[],
  ) => TE.TaskEither<Error, ActivationResult>;
}

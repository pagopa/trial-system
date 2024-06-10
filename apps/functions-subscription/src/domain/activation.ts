import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { NonNegativeNumber } from '@pagopa/ts-commons/lib/numbers';
import { TrialId, TrialIdCodec, UserIdCodec } from './subscription';

const BaseActivationItemCodec = t.strict({
  id: t.string,
  trialId: TrialIdCodec,
  _etag: t.string,
});

export const ActivationRequestItemCodec = t.intersection([
  BaseActivationItemCodec,
  t.strict({
    userId: UserIdCodec,
    createdAt: IsoDateFromString,
    type: t.literal('request'),
    activated: t.boolean,
  }),
]);
export type ActivationRequestItem = t.TypeOf<typeof ActivationRequestItemCodec>;

export const ActivationJobItemCodec = t.intersection([
  BaseActivationItemCodec,
  t.strict({
    createdAt: IsoDateFromString,
    usersToActivate: NonNegativeNumber,
    usersActivated: NonNegativeNumber,
    type: t.literal('job'),
  }),
]);
export type ActivationJobItem = t.TypeOf<typeof ActivationJobItemCodec>;

export type ActivationResult = 'success' | 'fail' | 'not-executed';

export interface ActivationConsumer {
  /**
   * This function returns a list of activation requests that are going to be
   * activated.
   * The input is an object representing the trialId of the requests to enable and
   * the number of activation requests to activate.
   */
  readonly fetchActivationRequestItemsToActivate: (
    trialId: TrialId,
    elementsToFetch: number,
  ) => TE.TaskEither<Error, readonly ActivationRequestItem[]>;

  /**
   * This function is responsible to activate the activation requests.
   * The input is a list of activation requests that are going to be activated.
   * If any of the activation request cannot be activated, then none of them
   * are activated.
   */
  readonly activateRequestItems: (
    jobId: string,
    trialId: TrialId,
    activationRequests: readonly ActivationRequestItem[],
  ) => TE.TaskEither<Error, ActivationResult>;
}

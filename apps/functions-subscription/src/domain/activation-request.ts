import * as t from 'io-ts';
import * as TE from 'fp-ts/TaskEither';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { TrialId, TrialIdCodec, UserIdCodec } from './subscription';
import { ActivationJob } from './activation-job';

// a unique brand for id of document with type request
interface ActivationRequestIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly ActivationRequestId: unique symbol;
}
export const ActivationRequestIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, ActivationRequestIdBrand> =>
    str.length > 0,
  'ActivationRequestId',
);
export type ActivationRequestId = t.TypeOf<typeof ActivationRequestIdCodec>;

export const ActivationRequestCodec = t.strict({
  id: ActivationRequestIdCodec,
  trialId: TrialIdCodec,
  _etag: t.string,
  userId: UserIdCodec,
  createdAt: IsoDateFromString,
  type: t.literal('request'),
  activated: t.boolean,
});
export type ActivationRequest = t.TypeOf<typeof ActivationRequestCodec>;

export type ActivationResult = 'success' | 'fail';

export interface ActivationRequestRepository {
  /**
   * This function returns a list of activation requests that are going to be
   * activated.
   */
  readonly list: (
    trialId: TrialId,
    elementsToFetch: number,
  ) => TE.TaskEither<Error, readonly ActivationRequest[]>;

  /**
   * This function is responsible to activate the activation requests.
   * If any of the activation request cannot be activated, then none of them
   * are activated.
   */
  readonly activate: (
    job: ActivationJob,
    trialId: TrialId,
    activationRequests: readonly ActivationRequest[],
  ) => TE.TaskEither<Error, ActivationResult>;
}

import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { NonNegativeNumber } from '@pagopa/ts-commons/lib/numbers';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { TrialId, TrialIdCodec, UserIdCodec } from './subscription';

// a unique brand for id of document with type job
interface ActivationJobIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly ActivationJobId: unique symbol;
}
export const ActivationJobIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, ActivationJobIdBrand> =>
    str.length > 0,
  'ActivationJobId',
);
export type ActivationJobId = t.TypeOf<typeof ActivationJobIdCodec>;

export const ActivationJobItemCodec = t.strict({
  id: ActivationJobIdCodec,
  trialId: TrialIdCodec,
  _etag: t.string,
  createdAt: IsoDateFromString,
  usersToActivate: NonNegativeNumber,
  usersActivated: NonNegativeNumber,
  type: t.literal('job'),
});

export type ActivationJobItem = t.TypeOf<typeof ActivationJobItemCodec>;

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

export const ActivationRequestItemCodec = t.strict({
  id: ActivationRequestIdCodec,
  trialId: TrialIdCodec,
  _etag: t.string,
  userId: UserIdCodec,
  createdAt: IsoDateFromString,
  type: t.literal('request'),
  activated: t.boolean,
});
export type ActivationRequestItem = t.TypeOf<typeof ActivationRequestItemCodec>;

export type ActivationResult = 'success' | 'fail' | 'not-executed';

export interface ActivationConsumer {
  /**
   * This function returns a list of activation requests that are going to be
   * activated.
   */
  readonly fetchActivationRequestItemsToActivate: (
    trialId: TrialId,
    elementsToFetch: number,
  ) => TE.TaskEither<Error, readonly ActivationRequestItem[]>;

  /**
   * This function is responsible to activate the activation requests.
   * If any of the activation request cannot be activated, then none of them
   * are activated.
   */
  readonly activateRequestItems: (
    jobId: ActivationJobId,
    trialId: TrialId,
    activationRequests: readonly ActivationRequestItem[],
  ) => TE.TaskEither<Error, ActivationResult>;
}

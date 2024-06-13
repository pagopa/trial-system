import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { TrialId, TrialIdCodec, UserIdCodec } from './subscription';
import { ActivationJob } from './activation-job';
import { Capabilities } from './capabilities';
import { ItemAlreadyExists } from './errors';

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
  type: t.literal('request'),
  activated: t.boolean,
});
export type ActivationRequest = t.TypeOf<typeof ActivationRequestCodec>;

export type ActivationResult = 'success' | 'fail';

export interface ActivationRequestRepository {
  /**
   * Insert a new activation request.
   */
  readonly insert: (
    activationRequest: Omit<ActivationRequest, '_etag'>,
  ) => TE.TaskEither<Error | ItemAlreadyExists, ActivationRequest>;
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
    activationRequests: readonly ActivationRequest[],
  ) => TE.TaskEither<Error, ActivationResult>;
}

/**
 * This function is useful to create an activation request.
 */
export const makeActivationRequest = ({
  trialId,
  userId,
}: Pick<ActivationRequest, 'trialId' | 'userId'>) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'monotonicId'>>(),
    RTE.map(({ monotonicId }) => monotonicId()),
    RTE.map(({ value }) => value as ActivationRequestId),
    RTE.map((id) => ({
      id,
      trialId,
      userId,
      type: 'request' as const,
      activated: false,
    })),
  );

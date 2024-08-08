import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as O from 'fp-ts/lib/Option';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { SubscriptionState, UserIdCodec } from './subscription';
import { Capabilities } from './capabilities';
import { ItemAlreadyExists } from './errors';
import { TrialId, TrialIdCodec } from './trial';

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
  userId: UserIdCodec,
  type: t.literal('request'),
  state: SubscriptionState,
  _etag: t.string,
});
export type ActivationRequest = t.TypeOf<typeof ActivationRequestCodec>;
type InsertActivationRequest = Omit<ActivationRequest, '_etag'>;

export type ActivationResult = 'success' | 'fail';

export interface ActivationRequestReader {
  /**
   * This function returns a list of activation requests that are going to be
   * activated.
   */
  readonly list: (
    trialId: TrialId,
    limit: number,
  ) => TE.TaskEither<Error, readonly ActivationRequest[]>;
  readonly get: (
    trialId: ActivationRequest['trialId'],
    userId: ActivationRequest['userId'],
  ) => TE.TaskEither<Error, O.Option<ActivationRequest>>;
}

export interface ActivationRequestWriter {
  /**
   * Insert a new activation request.
   */
  readonly insert: (
    activationRequest: InsertActivationRequest,
  ) => TE.TaskEither<Error | ItemAlreadyExists, ActivationRequest>;
  /**
   * Updates the state of activation requests and adjusts the activation job counter accordingly.
   *
   * This function changes the state of the provided activation requests and updates the counter
   * of the activation job by increasing or decreasing it based on the number of activation requests
   * and their new state.
   *
   * @param activationRequests - An array of activation requests to be updated.
   * @param state - The new state to assign to the activation requests.
   * @returns A TaskEither that resolves to an {@link ActivationRequest} or an {@link Error}.
   */
  readonly updateActivationRequestsState: (
    activationRequests: readonly ActivationRequest[],
    state: ActivationRequest['state'],
  ) => TE.TaskEither<Error, ActivationResult>;
}

export const makeInsertActivationRequest = ({
  trialId,
  userId,
  state,
}: Pick<ActivationRequest, 'trialId' | 'userId' | 'state'>) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'monotonicIdFn'>>(),
    RTE.map(({ monotonicIdFn }) => monotonicIdFn()),
    RTE.map(({ value }) => value as ActivationRequestId),
    RTE.map((id) => ({
      id,
      trialId,
      userId,
      type: 'request' as const,
      state,
    })),
  );

export const insertActivationRequest = (request: InsertActivationRequest) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationRequestWriter'>>(),
    RTE.flatMapTaskEither(({ activationRequestWriter }) =>
      activationRequestWriter.insert(request),
    ),
  );

export const getActivationRequest = (
  trialId: ActivationRequest['trialId'],
  userId: ActivationRequest['userId'],
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationRequestReader'>>(),
    RTE.flatMapTaskEither(({ activationRequestReader }) =>
      activationRequestReader.get(trialId, userId),
    ),
  );

export const updateActivationRequestState = (
  requests: readonly ActivationRequest[],
  state: ActivationRequest['state'],
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationRequestWriter'>>(),
    RTE.flatMapTaskEither(({ activationRequestWriter }) =>
      activationRequestWriter.updateActivationRequestsState(requests, state),
    ),
  );

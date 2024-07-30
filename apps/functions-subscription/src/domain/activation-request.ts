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
   * This function is responsible to activate the activation requests.
   * If any of the activation request cannot be activated, then none of them
   * are activated.
   * All the activation request must be of the same trialId.
   */
  readonly activate: (
    activationRequests: readonly ActivationRequest[],
  ) => TE.TaskEither<Error, ActivationResult>;
  /**
   * This function is responsible to change the state of active activation requests.
   * This will also update the counter of the activation job decreasing it by
   * the number of activation requests with ACTIVE state.
   *
   * This function should not be used to activate.
   * If you want to activate any activation requests, then use
   * {@link activate} method.
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

export const activateActivationRequests = (
  requests: readonly ActivationRequest[],
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationRequestWriter'>>(),
    RTE.flatMapTaskEither(({ activationRequestWriter }) =>
      activationRequestWriter.activate(requests),
    ),
  );

export const updateState = (
  requests: readonly ActivationRequest[],
  state: ActivationRequest['state'],
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationRequestWriter'>>(),
    RTE.flatMapTaskEither(({ activationRequestWriter }) =>
      activationRequestWriter.updateActivationRequestsState(requests, state),
    ),
  );

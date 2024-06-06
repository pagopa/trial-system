import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';
import { ActivationJobRequest } from '../domain/activation';

type Env = Pick<Capabilities, 'activationService'>;

export const processActivationJob = (activationRequest: ActivationJobRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.flatMapTaskEither(({ activationService }) =>
      pipe(
        activationService.fetchActivationRequestsToActivate({
          usersToActivate: activationRequest.usersToActivate,
          usersActivated: activationRequest.usersActivated,
          trialId: activationRequest.trialId,
        }),
        // Create chunk of users
        TE.map((users) => RA.chunksOf(99)(users)), // FIXME: Remove magic number here
        // Activate chunk of users
        TE.flatMap(
          TE.traverseArray(activationService.activateActivationRequests),
        ),
      ),
    ),
    RTE.flatMapTaskEither(() => TE.right('Not Yet Implemented')),
  );

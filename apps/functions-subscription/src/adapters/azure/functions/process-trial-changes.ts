import { InvocationContext } from '@azure/functions';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as O from 'fp-ts/Option';
import * as t from 'io-ts';
import { TrialCodec } from '../../../domain/trial';
import { Capabilities } from '../../../domain/capabilities';
import { makeActivationJob } from '../../../domain/activation-job';
import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';
import { ItemAlreadyExists } from '../../../domain/errors';

export const makeTrialChangesHandler =
  (
    env: Pick<
      Capabilities,
      'channelAdmin' | 'trialWriter' | 'activationJobWriter'
    >,
  ) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (documents: unknown, _: InvocationContext) =>
    pipe(
      TE.fromEither(t.array(TrialCodec).decode(documents)),
      TE.map(
        RA.filterMap((trial) =>
          trial.state === 'CREATING' ? O.some(trial) : O.none,
        ),
      ),
      TE.flatMap(
        TE.traverseArray((trial) =>
          pipe(
            env.channelAdmin.create(trial.id),
            TE.chainFirst(() =>
              pipe(
                makeActivationJob({
                  trialId: trial.id,
                  usersToActivate: 0 as NonNegativeInteger,
                }),
                env.activationJobWriter.insert,
                TE.orElseW((err) =>
                  err instanceof ItemAlreadyExists
                    ? TE.right(void 0)
                    : TE.left(err),
                ),
              ),
            ),
            TE.flatMap(({ identityId }) =>
              // Update the trial, changing the state and adding reference to the created resources
              env.trialWriter.upsert({
                ...trial,
                identityId,
                state: 'CREATED',
              }),
            ),
          ),
        ),
      ),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();

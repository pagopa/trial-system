import { InvocationContext } from '@azure/functions';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as t from 'io-ts';
import { TrialCodec } from '../../../domain/trial';
import { Capabilities } from '../../../domain/capabilities';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

export const makeTrialChangesHandler =
  (env: Pick<Capabilities, 'channelAdmin' | 'trialWriter'>) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (documents: unknown, _: InvocationContext) =>
    pipe(
      TE.fromEither(t.array(TrialCodec).decode(documents)),
      TE.map(RA.filter(({ state }) => state === 'CREATING')),
      TE.flatMap(
        TE.traverseArray((trial) =>
          pipe(
            env.channelAdmin.create(trial.id),
            TE.flatMap(({ identityId }) =>
              // Update the trial, changing the state and adding reference to the created resources
              env.trialWriter.upsert({
                ...trial,
                identityId: identityId as NonEmptyString,
                state: 'CREATED' as const,
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

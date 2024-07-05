import { TrialId } from './trial';
import * as TE from 'fp-ts/TaskEither';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

interface Channel {
  readonly identityId: NonEmptyString;
  readonly queueName: NonEmptyString;
}

export interface ChannelAdmin {
  readonly create: (trialId: TrialId) => TE.TaskEither<Error, Channel>;
}

import { TrialId } from './trial';
import * as TE from 'fp-ts/TaskEither';

interface Channel {
  readonly identityId: string;
  readonly queueName: string;
}

export interface ChannelAdmin {
  readonly create: (trialId: TrialId) => TE.TaskEither<Error, Channel>;
}

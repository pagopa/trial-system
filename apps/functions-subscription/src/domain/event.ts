import * as TE from 'fp-ts/TaskEither';
import { Subscription } from './subscription';

export interface EventWriter {
  readonly send: (subsciption: Subscription) => TE.TaskEither<Error, void>;
}

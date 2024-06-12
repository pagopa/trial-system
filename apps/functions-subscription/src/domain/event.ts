import * as TE from 'fp-ts/TaskEither';
import { Subscription } from './subscription';

export interface EventWriter {
  readonly send: (subscription: Subscription) => TE.TaskEither<Error, void>;
}

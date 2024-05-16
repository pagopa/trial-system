import * as RTE from 'fp-ts/ReaderTaskEither';
import * as TE from 'fp-ts/TaskEither';
import { insertSubscription } from './use-cases/insert-subscription';

type Test<T> = T extends (
  ...args: infer I
  /*eslint-disable-next-line @typescript-eslint/no-explicit-any */
) => RTE.ReaderTaskEither<any, infer E, infer A>
  ? (...args: I) => TE.TaskEither<E, A>
  : never;

export interface SystemEnv {
  readonly insertSubscription: Test<typeof insertSubscription>;
}

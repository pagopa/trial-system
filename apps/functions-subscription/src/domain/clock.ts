import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from './capabilities';
import { pipe } from 'fp-ts/lib/function';

export interface Clock {
  readonly now: () => Date;
}

export const nowDate = () =>
  pipe(
    RTE.ask<Pick<Capabilities, 'clock'>>(),
    RTE.map(({ clock }) => clock.now()),
  );

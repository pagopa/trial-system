import * as IO from 'fp-ts/IO';

interface HashedValue {
  readonly value: string;
}

export type HashFn = (str: string) => IO.IO<HashedValue>;

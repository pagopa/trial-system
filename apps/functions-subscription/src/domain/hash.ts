interface HashedValue {
  readonly value: string;
}

export type HashFn = (str: string) => HashedValue;

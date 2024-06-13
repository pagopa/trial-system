interface MonotonicId {
  readonly value: string;
}

export type MonotonicIdFn = () => MonotonicId;

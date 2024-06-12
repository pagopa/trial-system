export interface Id {
  readonly value: string;
}

export type MonotonicId = () => Id;

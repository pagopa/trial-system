export class TooManyRequestsError extends Error {
  readonly _tag = 'TooManyRequestsError';
}

export class ItemAlreadyExists extends Error {
  readonly _tag = 'ItemAlreadyExists';
}

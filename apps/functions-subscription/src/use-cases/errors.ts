export class SubscriptionAlreadyExists extends Error {
  readonly _tag = 'SubscriptionAlreadyExists';
}

/**
 * There was an error during insertion; the request is stored correctly and the
 * request is going to be processed asynchronously.
 */
export class SubscriptionStoreError extends Error {
  readonly _tag = 'SubscriptionStoreError';
}

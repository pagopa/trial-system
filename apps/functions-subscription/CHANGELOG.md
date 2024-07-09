# functions-subscription

## 1.3.0

### Minor Changes

- d48c7f1: [IOPLT-609] Create the activation job when creating a trial

## 1.2.0

### Minor Changes

- c4a3b1f: [IOPLT-583] Create trials consumer

### Patch Changes

- 49a5763: Topic subscription only filter messages with their `trialId` parameter

## 1.1.1

### Patch Changes

- 0d17625: [IOPLT-601] - Activate only subscriptions that are in the subscribed state

## 1.1.0

### Minor Changes

- c10257f: [IOPLT-578] - Update the number of activated users by inserting an active subscription
- d2b8827: [IOPLT-449] - Add handler to create a trial
- b24f9c6: Add `GET /trials/{id}` endpoint

### Patch Changes

- b24f9c6: Change the return status code of `POST /trials`
- 23efc4e: [IOPLT-586] - Fix SubscriptionEvent openapi definition

## 1.0.2

### Patch Changes

- 65fcf2e: Remove unused fields:
  - Remove `createdAt` from the `ActivationJob` object
  - Remove `activatedAt` from `Subscription` and `SubscriptionHistory`

## 1.0.1

### Patch Changes

- e79b6a4: [IOPLT-576] Fetch proper number of activation requests when processing an activation job

## 1.0.0

### Major Changes

- bba3b8d: \* Remove `/trials/{trialId}/activation-jobs` endpoints
  - Add `/trials/{trialId}/activation-job`

### Minor Changes

- d67aadf: [IOPLT-570] Add update activation job
- 49ebf2d: [IOPLT-571] Implement handler to get an activation job

## 0.7.0

### Minor Changes

- 15d4ea8: [IOPLT-554] Add handler to create an activation job
- d4bfd89: Add `state` property when creating a new subscription

## 0.6.2

### Patch Changes

- 9447cca: Update the updatedAt field when creating a new version of subscription history

## 0.6.1

### Patch Changes

- 8e665be: Fix issues on activations change feed

## 0.6.0

### Minor Changes

- 48362d8: [IOPLT-556] Add process activations change feed

## 0.5.0

### Minor Changes

- 80330a4: Create an activation request when processing a subscription request

### Patch Changes

- 5e46121: Bump @azure/identity from 4.2.0 to 4.2.1
- 4559acc: Bump braces from 3.0.2 to 3.0.3

## 0.4.0

### Minor Changes

- dc23360: [IOPLT-467] Add events producer

## 0.3.0

### Minor Changes

- 09c55db: Add activation job processor
- 83efeeb: [IOPLT-552] Add process that keeps `subscription` in sync with `subscription-history`
- 594322b: [IOPLT-528] Add event hub consumer to populate subscription-history

## 0.2.0

### Minor Changes

- 2739a3f: Add get subscription endpoint

### Patch Changes

- d7a1f73: Change authLevel for create subscription endpoint
- 7107ec4: [IOPLT-534] Migrate to managed identities

## 0.1.0

### Minor Changes

- 92d9358: [IOPLT-525] Add adapters required by insert subscription

### Patch Changes

- 669efed: - Replace all `$ref: '#/components/responses/...'` references with definitions.
  - Define some properties as required.
  - Add `409` and `202` responses.
- f05554f: Create first Azure functions with /info endpoint

# functions-subscription

## 3.9.0

### Minor Changes

- aaf2fd0: [IOPLT-746] Create endpoint to get the trial list

## 3.8.2

### Patch Changes

- ddb27e9: [IOPLT-718] Allow ApiTrialSupport to use method getSubscription

## 3.8.1

### Patch Changes

- c471578: [IOPLT-774] Add `Support` tenant

## 3.8.0

### Minor Changes

- b35d13b: [IOPLT-748] Add listTrials to OpenAPI Specification.
- 87703c7: [IOPLT-772] Add ApiTrialSupport to AllowedGroup type.

## 3.7.1

### Patch Changes

- 2d49887: [IOPLT-767] Check the trial belongs to the owner on missing endpoints

## 3.7.0

### Minor Changes

- c649cb2: [IOPLT-675] Handle the tenant when calling `getTrial` function

## 3.6.1

### Patch Changes

- fee8730: [IOPLT-750] Update query removing the use of the partition key

## 3.6.0

### Minor Changes

- 35c8bcf: [IOPLT-743] Get CosmosDB container names from the configuration
- ad2589a: [IOPLT-740] Persist `ownerId` when creating a trial

## 3.5.0

### Minor Changes

- 29f9970: [IOPLT-739] Replace authorization middleware

## 3.4.0

### Minor Changes

- cf5523c: [IOPLT-728] Add `403 Forbidden` response to some endpoints in the OpenAPI

### Patch Changes

- 88f9d89: [IOPLT-730] Add middleware that authorize user information got from HTTP request
- f7a12ca: [IOPLT-731] Add missing headers to HTTP request on unit tests

## 3.3.0

### Minor Changes

- 4c39e31: Decode CosmosConnection variables; if the variables are missing, there will be a runtime error on startup.

## 3.2.1

### Patch Changes

- c3bc5ee: Add Application Insights

## 3.2.0

### Minor Changes

- ca7c35f: [IOPLT-700] Update logic of middleware that checks `x-user-groups` header.
  Now the allowed values for the `x-user-groups` are: `ApiTrialManager` and `ApiTrialUser`.

## 3.1.2

### Patch Changes

- 48c9218: Bump version of `@azure` packages

## 3.1.1

### Patch Changes

- 39a8213: Bump @azure/functions package

  Version [4.5.0 fixed an error where the retry option were ignored](https://github.com/Azure/azure-functions-nodejs-library/releases/tag/v4.5.0).

## 3.1.0

### Minor Changes

- bfef558: Add endpoint to update the `state` of a subscription

## 3.0.1

### Patch Changes

- 44a2f9b: Remove public Open API

## 3.0.0

### Major Changes

- 4f2be20: [IOPLT-655] Turn on activation consumer

## 2.1.0

### Minor Changes

- cd037a0: [IOPLT-653, IOPLT-657] Update logic to use `state` property instead of `activated`

## 2.0.2

### Patch Changes

- 7643264: [IOPLT-646] Fix issue on activation job processing function

## 2.0.1

### Patch Changes

- 1c06327: [IOPLT-620] Add check on x-user-groups header

## 2.0.0

### Major Changes

- 38a0212: [IOPLT-612] Remove `POST /trials/:id/activation-job` endpoint

## 1.3.3

### Patch Changes

- b483962: [IOPLT-625] Create another cosmos client with connection policy that redirects reads on `subscription` container to the replicated region

## 1.3.2

### Patch Changes

- 6220496: Improvements due to load tests

## 1.3.1

### Patch Changes

- b89e510: [IOPLT-610] - Check trial exists when creating a subscription

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

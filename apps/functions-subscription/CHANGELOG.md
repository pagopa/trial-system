# functions-subscription

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

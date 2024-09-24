import * as H from '@pagopa/handler-kit';
import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { Subscription as SubscriptionAPI } from '../../../generated/definitions/internal/Subscription';
import { CreateSubscription } from '../../../generated/definitions/internal/CreateSubscription';
import { UserId } from '../../../domain/subscription';
import { SystemEnv } from '../../../system-env';
import { SubscriptionStoreError } from '../../../use-cases/errors';
import {
  parsePathParameter,
  parseRequestBody,
  verifyUserGroup,
} from './middleware';
import { toHttpProblemJson } from './errors';
import { toSubscriptionAPI } from './codec';
import { TrialIdCodec } from '../../../domain/trial';

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<SubscriptionAPI, 201>
  | H.HttpResponse<unknown, 202>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Pick<SystemEnv, 'createSubscription'>
> = H.of((req: H.HttpRequest) => {
  return pipe(
    RTE.ask<Pick<SystemEnv, 'createSubscription'>>(),
    RTE.apFirst(
      RTE.fromEither(verifyUserGroup(['ApiTrialManager', 'ApiTrialUser'])(req)),
    ),
    RTE.apSW(
      'requestBody',
      RTE.fromEither(parseRequestBody(CreateSubscription)(req)),
    ),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(TrialIdCodec, 'trialId')(req)),
    ),
    RTE.flatMapTaskEither(({ createSubscription, trialId, requestBody }) =>
      createSubscription(
        requestBody.userId as unknown as UserId,
        trialId,
        requestBody.state,
      ),
    ),
    RTE.map((sub) => ({ kind: 'Subscription' as const, ...sub })),
    RTE.orElseW((err) => {
      // Handle errors
      if (err instanceof SubscriptionStoreError) {
        // If SubscriptionStoreError, we should return a 202 on HTTP
        // So we are passing a structure to the next step with the `kind`
        // parameter that we are going to use as discriminator.
        return RTE.right({ kind: 'SubscriptionRequest' as const });
      } else return RTE.left(err);
    }),
    RTE.map((result) => {
      if (result.kind === 'Subscription') {
        // Subscription created, return 201
        return pipe(result, toSubscriptionAPI, H.createdJson);
      } else {
        // Subscription queued, but not yet persisted.
        // Return 202
        return pipe({}, H.successJson, H.withStatusCode(202));
      }
    }),
    RTE.mapLeft(toHttpProblemJson),
    RTE.orElseW(RTE.of),
  );
});

export const makePostSubscriptionHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

import * as H from '@pagopa/handler-kit';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { Subscription as SubscriptionAPI } from '../../../generated/definitions/internal/Subscription';
import { CreateSubscription } from '../../../generated/definitions/internal/CreateSubscription';
import { UserId, TrialId, Subscription } from '../../../domain/subscription';
import { SubscriptionStateEnum } from '../../../generated/definitions/internal/SubscriptionState';
import { SystemEnv } from '../../../system-env';
import { ItemAlreadyExists } from '../../../domain/errors';
import { SubscriptionStoreError } from '../../../use-cases/errors';
import { parsePathParameter, parseRequestBody } from './middleware';

const makeSubscriptionResp = (subscription: Subscription): SubscriptionAPI => ({
  trialId: subscription.trialId,
  userId: subscription.userId,
  state: SubscriptionStateEnum[subscription.state],
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
});

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<SubscriptionAPI, 201>
  | H.HttpResponse<unknown, 202>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  Pick<SystemEnv, 'insertSubscription'>
> = H.of((req: H.HttpRequest) => {
  return pipe(
    RTE.ask<Pick<SystemEnv, 'insertSubscription'>>(),
    RTE.apSW(
      'requestBody',
      RTE.fromEither(parseRequestBody(CreateSubscription)(req)),
    ),
    RTE.apSW(
      'trialId',
      RTE.fromEither(parsePathParameter(NonEmptyString, 'trialId')(req)),
    ),
    RTE.flatMapTaskEither(({ insertSubscription, trialId, requestBody }) =>
      insertSubscription(
        requestBody.userId as unknown as UserId,
        trialId as unknown as TrialId,
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
        return pipe(result, makeSubscriptionResp, H.createdJson);
      } else {
        // Subscription queued, but not yet persisted.
        // Return 202
        return pipe({}, H.successJson, H.withStatusCode(202));
      }
    }),
    RTE.mapLeft((err) => {
      if (err instanceof ItemAlreadyExists) {
        return pipe(err, H.toProblemJson, H.problemJson, H.withStatusCode(409));
      } else {
        return pipe(err, H.toProblemJson, H.problemJson);
      }
    }),
    RTE.orElseW(RTE.of),
  );
});

export const makePostSubscriptionHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

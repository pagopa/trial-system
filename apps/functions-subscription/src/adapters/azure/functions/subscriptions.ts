import * as H from '@pagopa/handler-kit';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { Subscription } from '../../../generated/definitions/internal/Subscription';
import { CreateSubscription } from '../../../generated/definitions/internal/CreateSubscription';
import {
  UserId,
  TrialId,
  Subscription as DomainSubscription,
} from '../../../domain/subscription';
import { SubscriptionStateEnum } from '../../../generated/definitions/internal/SubscriptionState';
import { SystemEnv } from '../../../system-env';
import { ItemAlreadyExists } from '../../../domain/errors';
import { SubscriptionStoreError } from '../../../use-cases/errors';
import { parsePathParameter, parseRequestBody } from './middleware';

const makeSubscriptionResp = (
  subscription: DomainSubscription,
): Subscription => ({
  trialId: subscription.trialId,
  userId: subscription.userId,
  state: SubscriptionStateEnum[subscription.state],
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
});

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<Subscription, 201>
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
      if (err instanceof SubscriptionStoreError) {
        return RTE.right({ kind: 'SubscriptionRequest' as const });
      } else return RTE.left(err);
    }),
    RTE.map((result) => {
      if (result.kind === 'Subscription')
        return pipe(result, makeSubscriptionResp, H.createdJson);
      else return pipe({}, H.successJson, H.withStatusCode(202));
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

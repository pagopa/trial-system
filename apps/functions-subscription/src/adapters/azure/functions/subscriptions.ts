import * as H from '@pagopa/handler-kit';
import { flow, pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as E from 'fp-ts/Either';
import { Decoder } from 'io-ts';
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

const parseRequestBody =
  <T>(schema: Decoder<unknown, T>) =>
  (req: H.HttpRequest) =>
    pipe(
      req.body,
      H.parse(schema, 'Missing or invalid body'),
      E.mapLeft(({ message }) => new H.HttpBadRequestError(message)),
    );

const parsePathParameter =
  <T>(schema: Decoder<unknown, T>) =>
  (paramName: string) =>
  (req: H.HttpRequest) =>
    pipe(
      req.path[paramName],
      H.parse(schema, `Invalid format of ${paramName} parameter`),
      E.mapLeft(({ message }) => new H.HttpBadRequestError(message)),
    );

const makeSubscriptionResp = (
  subscription: DomainSubscription,
): Subscription => ({
  trialId: subscription.trialId as unknown as NonEmptyString,
  userId: subscription.userId as unknown as NonEmptyString,
  state: SubscriptionStateEnum.UNSUBSCRIBED,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeHandlerKitHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<Subscription, 201>
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
      RTE.fromEither(parsePathParameter(NonEmptyString)('trialId')(req)),
    ),
    RTE.flatMapTaskEither(({ insertSubscription, trialId, requestBody }) =>
      insertSubscription(
        requestBody.userId as unknown as UserId, // FIXME Cast
        trialId as unknown as TrialId,
      ),
    ),
    RTE.map(flow(makeSubscriptionResp, H.createdJson)),
    RTE.orElseW(flow(H.toProblemJson, H.problemJson, RTE.of)),
  );
});

export const makePostSubscriptionHandler = httpAzureFunction(
  makeHandlerKitHandler,
);

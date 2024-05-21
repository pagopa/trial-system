import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { HttpRequest } from '@azure/functions';
import {
  makeAValidCreateSubscriptionRequest,
  makeAValidGetSubscriptionRequest,
} from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import {
  makeGetSubscriptionHandler,
  makePostSubscriptionHandler,
} from '../subscriptions';
import { SubscriptionStoreError } from '../../../../use-cases/errors';
import { aSubscription } from '../../../../domain/__tests__/data';
import { ItemAlreadyExists, ItemNotFound } from '../../../../domain/errors';

describe('subscriptions azure function', () => {
  describe('insert subscription', () => {
    it('should return 201 with the created subscription', async () => {
      const env = makeTestSystemEnv();
      env.insertSubscription.mockReturnValueOnce(TE.right(aSubscription));

      const actual = await makePostSubscriptionHandler(env)(
        makeAValidCreateSubscriptionRequest(),
        makeFunctionContext(),
      );
      expect(actual.status).toStrictEqual(201);
    });

    it('should return 202 on SubscriptionStoreError', async () => {
      const env = makeTestSystemEnv();
      env.insertSubscription.mockReturnValueOnce(
        TE.left(new SubscriptionStoreError()),
      );

      const actual = await makePostSubscriptionHandler(env)(
        makeAValidCreateSubscriptionRequest(),
        makeFunctionContext(),
      );
      expect(actual.status).toStrictEqual(202);
    });

    it('should return 400 when the request body is not valid', async () => {
      const aRequestWithInvalidBody = new HttpRequest({
        url: 'https://function/trials/{trialId}/subscriptions',
        method: 'POST',
        body: { string: '{}' },
        params: {
          trialId: 'aTrialId',
        },
      });
      const env = makeTestSystemEnv();
      const actual = await makePostSubscriptionHandler(env)(
        aRequestWithInvalidBody,
        makeFunctionContext(),
      );
      expect(actual.status).toStrictEqual(400);
    });

    it('should return 409 when the subscription already exists', async () => {
      const env = makeTestSystemEnv();
      env.insertSubscription.mockReturnValueOnce(
        TE.left(new ItemAlreadyExists('Already exists')),
      );
      const actual = await makePostSubscriptionHandler(env)(
        makeAValidCreateSubscriptionRequest(),
        makeFunctionContext(),
      );
      expect(actual.status).toStrictEqual(409);
    });

    it('should return 500 when the use case returned an error', async () => {
      const env = makeTestSystemEnv();
      env.insertSubscription.mockReturnValueOnce(
        TE.left(new Error('Something went wrong')),
      );

      const actual = await makePostSubscriptionHandler(env)(
        makeAValidCreateSubscriptionRequest(),
        makeFunctionContext(),
      );

      expect(actual.status).toStrictEqual(500);
    });
  });

  describe('get subscription', () => {
    it('should return 404 when the subscription does not exist', async () => {
      const env = makeTestSystemEnv();

      env.getSubscription.mockReturnValueOnce(
        TE.left(new ItemNotFound('Subscription not found')),
      );

      const actual = await makeGetSubscriptionHandler(env)(
        makeAValidGetSubscriptionRequest(),
        makeFunctionContext(),
      );

      expect(actual.status).toStrictEqual(404);
    });
    it('should return 500 when an error occurred', async () => {
      const env = makeTestSystemEnv();

      env.getSubscription.mockReturnValueOnce(
        TE.left(new Error('Something went wrong')),
      );

      const actual = await makeGetSubscriptionHandler(env)(
        makeAValidGetSubscriptionRequest(),
        makeFunctionContext(),
      );

      expect(actual.status).toStrictEqual(500);
    });
    it('should return 200 when the subscription exist', async () => {
      const env = makeTestSystemEnv();

      env.getSubscription.mockReturnValueOnce(TE.right(aSubscription));

      const actual = await makeGetSubscriptionHandler(env)(
        makeAValidGetSubscriptionRequest(),
        makeFunctionContext(),
      );

      expect(actual.status).toStrictEqual(200);
    });
  });
});

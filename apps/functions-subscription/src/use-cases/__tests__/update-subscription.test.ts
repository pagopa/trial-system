import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { anActivationRequest } from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { ItemNotFound } from '../../domain/errors';
import { updateSubscription } from '../update-subscription';

const { userId, trialId } = anActivationRequest;

describe('updateSubscription', () => {
  it('should return ItemNotFound if the activation request does not exist', async () => {
    const env = makeTestEnv();

    env.activationRequestReader.get.mockReturnValueOnce(TE.right(O.none));

    const actual = await updateSubscription(userId, trialId, 'DISABLED')(env)();

    expect(actual).toStrictEqual(
      E.left(new ItemNotFound('Subscription not found')),
    );
  });
  it('should disable the activation request', async () => {
    const env = makeTestEnv();

    env.activationRequestReader.get.mockReturnValueOnce(
      TE.right(O.some(anActivationRequest)),
    );
    env.activationRequestWriter.updateActivationRequestsState.mockReturnValueOnce(
      TE.right('success'),
    );

    const actual = await updateSubscription(userId, trialId, 'DISABLED')(env)();

    const updatedSubscription = {
      ...anActivationRequest,
      state: 'DISABLED',
    };
    expect(actual).toStrictEqual(E.right(updatedSubscription));
    expect(env.activationRequestReader.get).toHaveBeenNthCalledWith(
      1,
      anActivationRequest.trialId,
      anActivationRequest.userId,
    );
    expect(
      env.activationRequestWriter.updateActivationRequestsState,
    ).toHaveBeenNthCalledWith(
      1,
      [anActivationRequest],
      updatedSubscription.state,
    );
  });

  it('should not do anything when the state properties have the same values', async () => {
    const env = makeTestEnv();

    env.activationRequestReader.get.mockReturnValueOnce(
      TE.right(O.some(anActivationRequest)),
    );

    const actual = await updateSubscription(
      userId,
      trialId,
      'SUBSCRIBED',
    )(env)();

    expect(actual).toStrictEqual(E.right(anActivationRequest));
    expect(env.activationRequestReader.get).toHaveBeenNthCalledWith(
      1,
      anActivationRequest.trialId,
      anActivationRequest.userId,
    );
    expect(
      env.activationRequestWriter.updateActivationRequestsState,
    ).not.toHaveBeenCalled();
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.activationRequestReader.get.mockReturnValueOnce(TE.left(error));

    const actual = await updateSubscription(
      userId,
      trialId,
      'DISABLED',
    )(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});
import { describe, expect, it } from 'vitest';
import {
  anActivationJob,
  anActivationRequest,
} from '../../../../domain/__tests__/data';
import {
  makeFunctionContext,
  makeTestSystemEnv,
} from '../../functions/__tests__/mocks';
import * as TE from 'fp-ts/TaskEither';
import { makeActivationJobCosmosHandler } from '../activation-job';
import { Config } from '../../../../config';
import { ActivationJobItemCodec } from '../../../../domain/activation';

describe('makeActivationJobCosmosHandler', () => {
  const config = {
    activations: { concurrencyThreshold: 1, consumer: 'on' },
  } as Config;
  it('should process activation job document without error', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationJob];

    env.processActivationJob.mockReturnValueOnce(TE.right(['success']));

    const actual = await makeActivationJobCosmosHandler(env, config)(
      messages,
      context,
    );
    expect(actual).toStrictEqual(['success']);
    const expectedArgument = {
      ...ActivationJobItemCodec.encode(anActivationJob),
      createdAt: anActivationJob.createdAt,
    };

    expect(env.processActivationJob).toHaveBeenCalledWith(
      expectedArgument,
      config.activations.concurrencyThreshold,
    );
  });
  it('should return not-executed when updating a request item', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationRequest];

    const actual = await makeActivationJobCosmosHandler(env, config)(
      messages,
      context,
    );
    expect(actual).toStrictEqual(['not-executed']);

    expect(env.processActivationJob).toHaveBeenCalledTimes(0);
  });
  it('should return an error when the use case fails', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationJob];
    const unexpectedError = new Error('Unexpected Error');

    env.processActivationJob.mockReturnValueOnce(TE.left(unexpectedError));

    const actual = makeActivationJobCosmosHandler(env, config)(
      messages,
      context,
    );

    expect(actual).rejects.toStrictEqual(unexpectedError);
  });
});

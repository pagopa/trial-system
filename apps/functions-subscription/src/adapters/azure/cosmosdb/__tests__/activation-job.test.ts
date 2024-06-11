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
import { makeActivationJobConsumerHandler } from '../../functions/activation-job';
import { ActivationJobCodec } from '../../../../domain/activation-job';
import { TrialId } from '../../../../domain/subscription';

describe('makeActivationJobConsumerHandler', () => {
  const maxConcurrencyThreshold = 1;
  it('should process activation job document without error', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationJob];

    env.processActivationJob.mockReturnValueOnce(TE.right('success'));

    const actual = await makeActivationJobConsumerHandler(
      env,
      maxConcurrencyThreshold,
    )(messages, context);
    expect(actual).toStrictEqual(['success']);
    const expectedArgument = {
      ...ActivationJobCodec.encode(anActivationJob),
      createdAt: anActivationJob.createdAt,
    };

    expect(env.processActivationJob).toHaveBeenCalledWith(
      expectedArgument,
      maxConcurrencyThreshold,
    );
  });
  it('should return a success and a failure when two different jobs are processed', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const anotherJob = {
      ...anActivationJob,
      trialId: 'aTotallyDifferentTrial' as TrialId,
    };
    const messages = [anActivationJob, anActivationRequest, anotherJob];

    env.processActivationJob
      .mockReturnValueOnce(TE.right('success'))
      .mockReturnValueOnce(TE.right('fail'));

    const actual = await makeActivationJobConsumerHandler(
      env,
      maxConcurrencyThreshold,
    )(messages, context);
    expect(actual).toStrictEqual(['success', 'fail']);

    expect(env.processActivationJob).toHaveBeenCalledWith(
      {
        ...ActivationJobCodec.encode(anActivationJob),
        createdAt: anActivationJob.createdAt,
      },
      maxConcurrencyThreshold,
    );
    expect(env.processActivationJob).toHaveBeenCalledWith(
      {
        ...ActivationJobCodec.encode(anotherJob),
        createdAt: anotherJob.createdAt,
      },
      maxConcurrencyThreshold,
    );
  });
  it('should return success when updating a request item', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationRequest];

    const actual = await makeActivationJobConsumerHandler(
      env,
      maxConcurrencyThreshold,
    )(messages, context);
    expect(actual).toStrictEqual([]);

    expect(env.processActivationJob).toHaveBeenCalledTimes(0);
  });
  it('should return an error when the use case fails', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationJob];
    const unexpectedError = new Error('Unexpected Error');

    env.processActivationJob.mockReturnValueOnce(TE.left(unexpectedError));

    const actual = makeActivationJobConsumerHandler(
      env,
      maxConcurrencyThreshold,
    )(messages, context);

    expect(actual).rejects.toStrictEqual(unexpectedError);
  });
});

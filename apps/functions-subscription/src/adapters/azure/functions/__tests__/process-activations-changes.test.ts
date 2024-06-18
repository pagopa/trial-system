import { describe, expect, it } from 'vitest';
import {
  aSubscriptionHistoryV1,
  anActivationJob,
  anActivationRequest,
} from '../../../../domain/__tests__/data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { makeActivationsChangesHandler } from '../process-activations-changes';

const config = { activations: { consumer: 'on' as const, maxFetchSize: 1 } };

describe('makeActivationJobConsumerHandler', () => {
  it('should call processActivationJob as expected', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationJob];

    env.processActivationJob.mockReturnValueOnce(TE.right('success'));

    const actual = await makeActivationsChangesHandler({
      env,
      config,
    })(messages, context);

    expect(actual).toStrictEqual(['success']);
    expect(env.processActivationJob).toHaveBeenCalledWith(
      anActivationJob,
      config.activations.maxFetchSize,
    );
  });

  it('should fail if processActivationJob raise an error', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationJob];
    const unexpectedError = new Error('Unexpected Error');

    env.processActivationJob.mockReturnValueOnce(TE.left(unexpectedError));

    const actual = makeActivationsChangesHandler({
      env,
      config,
    })(messages, context);

    expect(actual).rejects.toStrictEqual(unexpectedError);
  });

  it('should call processActivationRequest as expected', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationRequest];

    env.processActivationRequest.mockReturnValueOnce(
      TE.right(O.some(aSubscriptionHistoryV1)),
    );

    const actual = await makeActivationsChangesHandler({
      env,
      config,
    })(messages, context);

    expect(actual).toStrictEqual(['success']);
    expect(env.processActivationRequest).toHaveBeenCalledWith(
      anActivationRequest,
    );
  });

  it('should fail if processActivationRequest raise an error', async () => {
    const env = makeTestSystemEnv();
    const context = makeFunctionContext();
    const messages = [anActivationRequest];
    const error = new Error('Oh No!');

    env.processActivationRequest.mockReturnValueOnce(TE.left(error));

    const actual = makeActivationsChangesHandler({
      env,
      config,
    })(messages, context);

    expect(actual).rejects.toStrictEqual(error);
  });
});

import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { HttpRequest } from '@azure/functions';
import { makeAValidCreateActivationJobRequest } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { anActivationJob } from '../../../../domain/__tests__/data';
import { ItemAlreadyExists } from '../../../../domain/errors';
import { makePostActivationJobHandler } from '../insert-activation-job';

describe('makePostActivationJobHandler', () => {
  it('should return 202 if insertActivationJob succeeds', async () => {
    const env = makeTestSystemEnv();
    const { trialId, usersToActivate } = anActivationJob;

    env.insertActivationJob.mockReturnValueOnce(TE.right(anActivationJob));

    const actual = await makePostActivationJobHandler(env)(
      makeAValidCreateActivationJobRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(202);
    expect(env.insertActivationJob).toBeCalledWith({
      trialId,
      usersToActivate,
    });
  });

  it('should return 400 when the request body is not valid', async () => {
    const env = makeTestSystemEnv();
    const aRequestWithInvalidBody = new HttpRequest({
      url: 'https://function/trials/{trialId}/activation-jobs',
      method: 'POST',
      body: { string: '{}' },
      params: {
        trialId: 'aTrialId',
      },
    });

    const actual = await makePostActivationJobHandler(env)(
      aRequestWithInvalidBody,
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(400);
    expect(await actual.json()).toMatchObject({
      status: 400,
      detail: 'Missing or invalid body',
    });
    expect(env.insertActivationJob).toBeCalledTimes(0);
  });

  it('should return 409 if insertActivationJob return ItemAlreadyExists', async () => {
    const env = makeTestSystemEnv();
    const error = new ItemAlreadyExists();

    env.insertActivationJob.mockReturnValueOnce(TE.left(error));

    const actual = await makePostActivationJobHandler(env)(
      makeAValidCreateActivationJobRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(409);
  });

  it('should return 500 if insertActivationJob fails', async () => {
    const env = makeTestSystemEnv();
    const error = new Error('Oh No!');

    env.insertActivationJob.mockReturnValueOnce(TE.left(error));

    const actual = await makePostActivationJobHandler(env)(
      makeAValidCreateActivationJobRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(500);
  });
});

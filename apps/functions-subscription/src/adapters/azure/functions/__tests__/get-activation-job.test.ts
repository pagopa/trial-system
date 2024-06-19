import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeAValidGetActivationJobRequest } from './data';
import { anActivationJob } from '../../../../domain/__tests__/data';
import { makeGetActivationJobHandler } from '../get-activation-job';

describe('makeGetActivationJobHandler', () => {
  it('should return 200 when the activation job exists', async () => {
    const env = makeTestSystemEnv();

    env.getActivationJob.mockReturnValueOnce(TE.right(O.some(anActivationJob)));

    const actual = await makeGetActivationJobHandler(env)(
      makeAValidGetActivationJobRequest(),
      makeFunctionContext(),
    );

    const expectedJson = {
      usersToActivate: anActivationJob.usersToActivate,
      usersActivated: anActivationJob.usersActivated,
      trialId: anActivationJob.trialId,
    };

    expect(actual.status).toStrictEqual(200);
    expect(await actual.json()).toMatchObject(expectedJson);
    expect(env.getActivationJob).toHaveBeenCalledWith(anActivationJob.trialId);
  });

  it('should return 404 when the job does not exist', async () => {
    const env = makeTestSystemEnv();
    env.getActivationJob.mockReturnValueOnce(TE.right(O.none));

    const actual = await makeGetActivationJobHandler(env)(
      makeAValidGetActivationJobRequest(),
      makeFunctionContext(),
    );

    const expectedJson = {
      status: 404,
      detail: 'Activation job not found',
    };

    expect(actual.status).toStrictEqual(404);
    expect(await actual.json()).toMatchObject(expectedJson);
  });
});

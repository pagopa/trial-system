import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import {
  makeAValidGetActivationJobRequest,
  managerHttpRequestHeaders,
} from './data';
import { anActivationJob } from '../../../../domain/__tests__/data';
import { makeGetActivationJobHandler } from '../get-activation-job';
import { HttpRequest } from '@azure/functions';

describe('makeGetActivationJobHandler', () => {
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const request = new HttpRequest({
      url: makeAValidGetActivationJobRequest().url,
      method: makeAValidGetActivationJobRequest().method,
      headers: {
        ...managerHttpRequestHeaders,
        'x-user-groups': 'Guest,AnotherGroup',
      },
      body: { string: await makeAValidGetActivationJobRequest().text() },
    });
    const env = makeTestSystemEnv();
    const actual = await makeGetActivationJobHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
    });
  });

  it('should return 200 when the activation job exists', async () => {
    const env = makeTestSystemEnv();

    env.getActivationJob.mockReturnValueOnce(TE.right(O.some(anActivationJob)));

    const actual = await makeGetActivationJobHandler(env)(
      makeAValidGetActivationJobRequest(),
      makeFunctionContext(),
    );

    const tenant = {
      id: managerHttpRequestHeaders['x-user-id'],
      type: 'owner',
    };

    expect(actual.status).toStrictEqual(200);
    expect(env.getActivationJob).toHaveBeenCalledWith(
      tenant,
      anActivationJob.trialId,
    );
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

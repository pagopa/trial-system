import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { HttpRequest } from '@azure/functions';
import {
  makeAValidUpdateActivationJobRequest,
  managerHttpRequestHeaders,
} from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { anActivationJob } from '../../../../domain/__tests__/data';
import { ItemNotFound } from '../../../../domain/errors';
import { makePutActivationJobHandler } from '../update-activation-job';

describe('makePutActivationJobHandler', () => {
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const request = new HttpRequest({
      url: makeAValidUpdateActivationJobRequest().url,
      method: makeAValidUpdateActivationJobRequest().method,
      headers: {
        ...managerHttpRequestHeaders,
        'x-user-groups': 'Guest,AnotherGroup',
      },
      body: { string: await makeAValidUpdateActivationJobRequest().text() },
    });
    const env = makeTestSystemEnv();
    const actual = await makePutActivationJobHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
    });
  });

  it('should return 200 if updateActivationJob succeeds', async () => {
    const env = makeTestSystemEnv();
    const { trialId, usersToActivate } = anActivationJob;

    env.updateActivationJob.mockReturnValueOnce(TE.right(anActivationJob));

    const actual = await makePutActivationJobHandler(env)(
      makeAValidUpdateActivationJobRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(200);
    expect(env.updateActivationJob).toBeCalledWith(trialId, {
      usersToActivate,
    });
  });

  it('should return 400 when the request body is not valid', async () => {
    const env = makeTestSystemEnv();
    const aRequestWithInvalidBody = new HttpRequest({
      url: 'https://function/trials/{trialId}/activation-job',
      method: 'PUT',
      headers: managerHttpRequestHeaders,
      body: { string: '{}' },
      params: {
        trialId: 'aTrialId',
      },
    });

    const actual = await makePutActivationJobHandler(env)(
      aRequestWithInvalidBody,
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(400);
    expect(await actual.json()).toMatchObject({
      status: 400,
      detail: 'Missing or invalid body',
    });
    expect(env.updateActivationJob).toBeCalledTimes(0);
  });

  it('should return 404 if updateActivationJob return ItemNotFound', async () => {
    const env = makeTestSystemEnv();
    const error = new ItemNotFound();

    env.updateActivationJob.mockReturnValueOnce(TE.left(error));

    const actual = await makePutActivationJobHandler(env)(
      makeAValidUpdateActivationJobRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(404);
  });

  it('should return 500 if updateActivationJob fails', async () => {
    const env = makeTestSystemEnv();
    const error = new Error('Oh No!');

    env.updateActivationJob.mockReturnValueOnce(TE.left(error));

    const actual = await makePutActivationJobHandler(env)(
      makeAValidUpdateActivationJobRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(500);
  });
});

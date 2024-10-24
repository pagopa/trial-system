import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { HttpRequest } from '@azure/functions';
import {
  makeAValidCreateTrialRequest,
  managerHttpRequestHeaders,
} from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { aTrial, aTrialOwner } from '../../../../domain/__tests__/data';
import { makePostTrialHandler } from '../create-trial';
import { ItemAlreadyExists } from '../../../../domain/errors';

describe('makePostTrialHandler', () => {
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const request = new HttpRequest({
      url: makeAValidCreateTrialRequest().url,
      method: makeAValidCreateTrialRequest().method,
      headers: {
        ...managerHttpRequestHeaders,
        'x-user-groups': 'Guest,AnotherGroup',
      },
      body: { string: await makeAValidCreateTrialRequest().text() },
    });
    const env = makeTestSystemEnv();
    const actual = await makePostTrialHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
    });
  });

  it('should return 202 with the created trial', async () => {
    const env = makeTestSystemEnv();
    env.createTrial.mockReturnValueOnce(TE.right(aTrial));

    const actual = await makePostTrialHandler(env)(
      makeAValidCreateTrialRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(202);
    expect(env.createTrial).toHaveBeenCalledWith(
      aTrial.name,
      aTrial.description,
      aTrialOwner,
    );
  });

  it('should return 400 when the request body is not valid', async () => {
    const aRequestWithInvalidBody = new HttpRequest({
      url: 'https://function/trials',
      method: 'POST',
      headers: managerHttpRequestHeaders,
      body: { string: '{}' },
    });
    const env = makeTestSystemEnv();
    const actual = await makePostTrialHandler(env)(
      aRequestWithInvalidBody,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(400);
    expect(await actual.json()).toMatchObject({
      status: 400,
      detail: 'Missing or invalid body',
    });
  });

  it('should return 409 when the trial already exists', async () => {
    const env = makeTestSystemEnv();
    const error = new ItemAlreadyExists('Already exists');
    env.createTrial.mockReturnValueOnce(TE.left(error));
    const actual = await makePostTrialHandler(env)(
      makeAValidCreateTrialRequest(),
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(409);
    expect(await actual.json()).toMatchObject({
      status: 409,
      detail: error.message,
    });
  });

  it('should return 500 when the use case returned an error', async () => {
    const env = makeTestSystemEnv();
    const error = new Error('Something went wrong');
    env.createTrial.mockReturnValueOnce(TE.left(error));

    const actual = await makePostTrialHandler(env)(
      makeAValidCreateTrialRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(500);
    expect(await actual.json()).toMatchObject({
      status: 500,
      detail: error.message,
    });
  });
});

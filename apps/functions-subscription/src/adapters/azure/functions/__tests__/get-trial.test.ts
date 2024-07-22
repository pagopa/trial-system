import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { makeAValidGetTrialRequest } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeGetTrialHandler } from '../get-trial';
import { aTrial } from '../../../../domain/__tests__/data';
import { HttpRequest } from '@azure/functions';

describe('makeGetTrialHandler', () => {
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const request = new HttpRequest({
      url: makeAValidGetTrialRequest().url,
      method: makeAValidGetTrialRequest().method,
      headers: { 'x-user-groups': 'Guest,AnotherGroup' },
      body: { string: await makeAValidGetTrialRequest().text() },
    });
    const env = makeTestSystemEnv();
    const actual = await makeGetTrialHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
      detail: 'Missing required groups: ApiTrialManager',
    });
  });
  it('should return 404 when the trial does not exist', async () => {
    const env = makeTestSystemEnv();

    env.getTrial.mockReturnValueOnce(TE.right(O.none));

    const actual = await makeGetTrialHandler(env)(
      makeAValidGetTrialRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(404);
    expect(await actual.json()).toMatchObject({
      status: 404,
      detail: 'Trial not found',
    });
  });

  it('should return 500 when an error occurred', async () => {
    const env = makeTestSystemEnv();

    const error = new Error('Something went wrong');
    env.getTrial.mockReturnValueOnce(TE.left(error));

    const actual = await makeGetTrialHandler(env)(
      makeAValidGetTrialRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(500);
    expect(await actual.json()).toMatchObject({
      status: 500,
      detail: error.message,
    });
  });

  it('should return 200 when the trial exist', async () => {
    const env = makeTestSystemEnv();

    env.getTrial.mockReturnValueOnce(TE.right(O.some(aTrial)));

    const actual = await makeGetTrialHandler(env)(
      makeAValidGetTrialRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(200);
  });
});

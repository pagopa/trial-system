import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { makeAValidListTrialRequest, supportHttpRequestHeaders } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeListTrialsHandler } from '../list-trials';
import { aTrial1, aTrial2 } from '../../../../domain/__tests__/data';
import { HttpRequest } from '@azure/functions';
import { Trial } from '../../../../domain/trial';

describe('makeGetTrialHandler', () => {
  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const request = new HttpRequest({
      url: makeAValidListTrialRequest().url,
      method: makeAValidListTrialRequest().method,
      headers: {
        ...supportHttpRequestHeaders,
        'x-user-groups': 'Guest,AnotherGroup',
      },
      body: { string: await makeAValidListTrialRequest().text() },
    });
    const env = makeTestSystemEnv();
    const actual = await makeListTrialsHandler(env)(
      request,
      makeFunctionContext(),
    );
    expect(actual.status).toStrictEqual(403);
    expect(await actual.json()).toMatchObject({
      status: 403,
    });
  });

  it('should return empty list when the are no trials', async () => {
    const env = makeTestSystemEnv();

    env.listTrials.mockReturnValueOnce(TE.right([]));

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest(),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(200);
    expect(await actual.json()).toMatchObject([]);
  });

  it('should return 500 when an error occurred', async () => {
    const env = makeTestSystemEnv();

    const error = new Error('Something went wrong');
    env.listTrials.mockReturnValueOnce(TE.left(error));

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest(),
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

    env.listTrials.mockReturnValueOnce(TE.right([aTrial1, aTrial2]));

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest(),
      makeFunctionContext(),
    );

    const result: readonly Trial[] = (await actual.json()) as readonly Trial[];

    expect(actual.status).toStrictEqual(200);
    expect(result.length).toStrictEqual(2);

    expect(result[0].name).toMatchObject(aTrial1.name);
    expect(result[0].description).toMatchObject(aTrial1.description);

    expect(result[1].name).toMatchObject(aTrial2.name);
    expect(result[1].description).toMatchObject(aTrial2.description);
  });
});

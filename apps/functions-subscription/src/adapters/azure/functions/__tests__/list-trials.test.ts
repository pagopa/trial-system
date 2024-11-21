import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { makeAValidListTrialRequest, supportHttpRequestHeaders } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeListTrialsHandler } from '../list-trials';
import { aTrial } from '../../../../domain/__tests__/data';
import { HttpRequest } from '@azure/functions';
import { Trial } from '../../../../domain/trial';
import { TrialSlim } from '../../../../generated/definitions/internal/TrialSlim';
import { TrialStateEnum } from '../../../../generated/definitions/internal/TrialState';
import { TrialId } from '../../../../generated/definitions/internal/TrialId';

describe('makeListTrialsHandler', () => {
  const anotherTrial = {
    ...aTrial,
    id: 'anotherTrialId',
  } as Trial;

  it('should return 400 on out of range pageSize parameter', async () => {
    const env = makeTestSystemEnv();

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest({ pageSize: '101' }),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(400);
    expect(await actual.json()).toMatchObject({
      status: 400,
      title: 'Bad Request',
    });
  });

  it('should return 400 on invalid pageSize parameter', async () => {
    const env = makeTestSystemEnv();

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest({ pageSize: 'aString' }),
      makeFunctionContext(),
    );

    expect(actual.status).toStrictEqual(400);
    expect(await actual.json()).toMatchObject({
      status: 400,
      title: 'Bad Request',
    });
  });

  it('should return 403 if x-user-groups header does not contain the correct group', async () => {
    const request = new HttpRequest({
      url: makeAValidListTrialRequest().url,
      method: makeAValidListTrialRequest().method,
      headers: {
        ...supportHttpRequestHeaders,
        'x-user-groups': 'Guest,AnotherGroup',
      },
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

  it('should return 200 when trials exists', async () => {
    const env = makeTestSystemEnv();

    const aSlimTrial: TrialSlim = {
      id: aTrial.id as TrialId,
      name: aTrial.name,
      state: TrialStateEnum[aTrial.state],
      description: aTrial.description,
    };

    const anotherSlimTrial = {
      ...aSlimTrial,
      id: 'anotherTrialId' as TrialId,
    };

    env.listTrials.mockReturnValueOnce(TE.right([aTrial, anotherTrial]));

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest({
        pageSize: '2',
        maximumId: 'z',
        minimumId: 'a',
      }),
      makeFunctionContext(),
    );

    expect(env.listTrials).nthCalledWith(1, {
      pageSize: 2,
      maximumId: 'z',
      minimumId: 'a',
    });

    const result = await actual.json();

    expect(actual.status).toStrictEqual(200);

    expect(result).toMatchObject({
      items: [aSlimTrial, anotherSlimTrial],
      previousId: anotherSlimTrial.id,
      nextId: aSlimTrial.id,
    });
  });

  it('should return empty list when the are no trials', async () => {
    const env = makeTestSystemEnv();

    env.listTrials.mockReturnValueOnce(TE.right([]));

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest(),
      makeFunctionContext(),
    );

    expect(env.listTrials).nthCalledWith(1, {
      pageSize: 25,
    });

    expect(actual.status).toStrictEqual(200);
    expect(await actual.json()).toStrictEqual({ items: [] });
  });
});

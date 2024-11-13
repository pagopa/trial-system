import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { makeAValidListTrialRequest, supportHttpRequestHeaders } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeListTrialsHandler } from '../list-trials';
import { aTrial } from '../../../../domain/__tests__/data';
import { HttpRequest } from '@azure/functions';
import { Trial, TrialId } from '../../../../domain/trial';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

describe('makeListTrialsHandler', () => {
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
    expect(await actual.json()).toStrictEqual({ items: [] });
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

  it('should return 200 when the trial exists', async () => {
    const env = makeTestSystemEnv();

    const aSlimTrial = {
      id: aTrial.id,
      name: aTrial.name,
      state: aTrial.state,
      description: aTrial.description,
    } as Trial;

    const anotherSlimTrial = {
      ...aSlimTrial,
      id: 'anotherTrialId' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
    } as Trial;

    env.listTrials.mockReturnValueOnce(
      TE.right([aSlimTrial, anotherSlimTrial]),
    );

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest(),
      makeFunctionContext(),
    );

    const result = await actual.json();

    expect(actual.status).toStrictEqual(200);

    expect(result).toMatchObject({
      items: [aSlimTrial, anotherSlimTrial],
      previousId: anotherSlimTrial.id,
      nextId: aSlimTrial.id,
    });
  });
});

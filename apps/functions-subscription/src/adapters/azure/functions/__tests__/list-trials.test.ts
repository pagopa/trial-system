import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import { makeAValidListTrialRequest, supportHttpRequestHeaders } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeListTrialsHandler } from '../list-trials';
import { aTrial } from '../../../../domain/__tests__/data';
import { HttpRequest } from '@azure/functions';
import { TrialPaginatedCollection } from '../../../../generated/definitions/internal/TrialPaginatedCollection';
import { TrialId } from '../../../../domain/trial';
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
    expect(await actual.json()).toMatchObject({ items: [] });
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

    const anotherTrial = {
      ...aTrial,
      id: 'anotherTrialId012345678901' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
      description: 'anotherTrialDescription',
    };

    env.listTrials.mockReturnValueOnce(TE.right([aTrial, anotherTrial]));

    const actual = await makeListTrialsHandler(env)(
      makeAValidListTrialRequest(),
      makeFunctionContext(),
    );

    const result = (await actual.json()) as TrialPaginatedCollection;

    expect(actual.status).toStrictEqual(200);
    expect(result.items.length).toStrictEqual(2);

    expect(result.items[0].name).toMatchObject(aTrial.name);
    expect(result.items[0].description).toMatchObject(aTrial.description);

    expect(result.items[1].name).toMatchObject(anotherTrial.name);
    expect(result.items[1].description).toMatchObject(anotherTrial.description);
  });
});

import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { makeAValidGetTrialRequest } from './data';
import { makeFunctionContext, makeTestSystemEnv } from './mocks';
import { makeGetTrialHandler } from '../get-trial';
import { aTrial } from '../../../../domain/__tests__/data';

describe('makeGetTrialHandler', () => {
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

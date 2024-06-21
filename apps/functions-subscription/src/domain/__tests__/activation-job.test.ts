import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { anActivationJob } from './data';
import { makeTestEnv } from './mocks';
import {
  getActivationJob,
  insertActivationJob,
  updateActivationJob,
} from '../activation-job';

describe('insertActivationJob', () => {
  it('should call insert as expected', async () => {
    const testEnv = makeTestEnv();
    const { trialId, usersToActivate } = anActivationJob;

    testEnv.activationJobWriter.insert.mockReturnValueOnce(
      TE.right(anActivationJob),
    );

    const actual = await insertActivationJob({ trialId, usersToActivate })(
      testEnv,
    )();
    const expected = E.right(anActivationJob);

    expect(actual).toStrictEqual(expected);
    expect(testEnv.activationJobWriter.insert).toBeCalledWith(anActivationJob);
  });
});

describe('getActivationJob', () => {
  it('should return a Some when the activation job exists', async () => {
    const testEnv = makeTestEnv();
    const { trialId: id } = anActivationJob;

    testEnv.activationJobReader.get.mockReturnValueOnce(
      TE.right(O.some(anActivationJob)),
    );

    const actual = await getActivationJob(id)(testEnv)();
    const expected = E.right(O.some(anActivationJob));

    expect(actual).toStrictEqual(expected);
    expect(testEnv.activationJobReader.get).toBeCalledWith(id);
  });

  it('should return a None when the activation job does not exist', async () => {
    const testEnv = makeTestEnv();
    const { trialId: id } = anActivationJob;

    testEnv.activationJobReader.get.mockReturnValueOnce(TE.right(O.none));

    const actual = await getActivationJob(id)(testEnv)();
    const expected = E.right(O.none);

    expect(actual).toStrictEqual(expected);
  });
});

describe('updateActivationJob', () => {
  it('should call update as expected', async () => {
    const testEnv = makeTestEnv();
    const { trialId, usersToActivate } = anActivationJob;
    const update = { usersToActivate };

    testEnv.activationJobWriter.update.mockReturnValueOnce(
      TE.right(anActivationJob),
    );

    const actual = await updateActivationJob(trialId, update)(testEnv)();
    const expected = E.right(anActivationJob);

    expect(actual).toStrictEqual(expected);
    expect(testEnv.activationJobWriter.update).toBeCalledWith(trialId, update);
  });
});

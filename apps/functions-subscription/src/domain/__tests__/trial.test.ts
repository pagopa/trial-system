import { aTrial, aTrialOwner, aTrial1, aTrial2 } from './data';
import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { insertTrial, listTrials } from '../trial';
import { ItemAlreadyExists } from '../errors';
import { makeTestEnv } from './mocks';

const { name, description } = aTrial;

describe('insertTrial', () => {
  it('should return the trial created', async () => {
    const testEnv = makeTestEnv();

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.right(aTrial));

    const actual = await insertTrial(name, description, aTrialOwner)(testEnv)();
    const expected = E.right(aTrial);

    expect(actual).toMatchObject(expected);
    expect(testEnv.trialWriter.insert).toBeCalledWith(aTrial);
  });

  it('should return all trials', async () => {
    const testEnv = makeTestEnv();

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial1.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.right(aTrial1));

    await insertTrial(
      aTrial1.name,
      aTrial2.description,
      aTrialOwner,
    )(testEnv)();

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial2.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.right(aTrial2));

    await insertTrial(
      aTrial2.name,
      aTrial2.description,
      aTrialOwner,
    )(testEnv)();

    testEnv.trialReader.list.mockReturnValueOnce(TE.right([aTrial1, aTrial2]));

    const actual = await listTrials(1, aTrial1.id, aTrial2.id)(testEnv)();
    const expected = E.right([aTrial1, aTrial2]);

    expect(actual).toMatchObject(expected);
  });

  it('should return error if the trial already exists', async () => {
    const testEnv = makeTestEnv();
    const error = new ItemAlreadyExists('Trial already exists');

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await insertTrial(name, description, aTrialOwner)(testEnv)();
    const expected = E.left(error);
    expect(actual).toStrictEqual(expected);
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await insertTrial(name, description, aTrialOwner)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

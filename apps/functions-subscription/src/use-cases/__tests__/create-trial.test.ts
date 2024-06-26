import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { createTrial } from '../create-trial';
import { aTrial } from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { ItemAlreadyExists } from '../../domain/errors';

const { name, description } = aTrial;

describe('createTrial', () => {
  it('should return the trial created', async () => {
    const testEnv = makeTestEnv();

    testEnv.hashFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.right(aTrial));

    const actual = await createTrial(name, description)(testEnv)();
    const expected = E.right(aTrial);

    expect(actual).toMatchObject(expected);
    expect(testEnv.trialWriter.insert).toBeCalledWith(aTrial);
  });

  it('should return error if the trial already exists', async () => {
    const testEnv = makeTestEnv();
    const error = new ItemAlreadyExists('Trial already exists');

    testEnv.hashFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await createTrial(name, description)(testEnv)();
    const expected = E.left(error);
    expect(actual).toStrictEqual(expected);
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.hashFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await createTrial(name, description)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

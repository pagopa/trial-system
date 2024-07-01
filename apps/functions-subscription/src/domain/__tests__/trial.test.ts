import { aTrial } from './data';
import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { insertTrial } from '../trial';
import { ItemAlreadyExists } from '../errors';
import { makeTestEnv } from './mocks';

const { name, description, createdAt } = aTrial;

describe('insertTrial', () => {
  it('should return the trial created', async () => {
    const testEnv = makeTestEnv();

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.clock.now.mockReturnValueOnce(createdAt);
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.right(aTrial));

    const expectedTrial = {
      ...aTrial,
      createdAt: createdAt,
      updatedAt: createdAt,
    };

    const actual = await insertTrial(name, description)(testEnv)();
    const expected = E.right(expectedTrial);

    expect(actual).toMatchObject(expected);
    expect(testEnv.trialWriter.insert).toBeCalledWith(expectedTrial);
  });

  it('should return error if the trial already exists', async () => {
    const testEnv = makeTestEnv();
    const error = new ItemAlreadyExists('Trial already exists');

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.clock.now.mockReturnValueOnce(createdAt);
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await insertTrial(name, description)(testEnv)();
    const expected = E.left(error);
    expect(actual).toStrictEqual(expected);
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: aTrial.id });
    testEnv.clock.now.mockReturnValueOnce(createdAt);
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await insertTrial(name, description)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

import { aTrial, aTrialOwner } from './data';
import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { insertTrial, listTrials, TrialId } from '../trial';
import { ItemAlreadyExists } from '../errors';
import { makeTestEnv } from './mocks';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

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

    const anotherTrial = {
      ...aTrial,
      id: 'anotherTrialId' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
      description: 'anotherTrialDescription',
    };

    testEnv.trialReader.list.mockReturnValueOnce(
      TE.right([aTrial, anotherTrial]),
    );

    const actual = await listTrials({
      pageSize: 1,
      maximumId: undefined,
      minimumId: undefined,
    })(testEnv)();
    const expected = E.right([aTrial, anotherTrial]);

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

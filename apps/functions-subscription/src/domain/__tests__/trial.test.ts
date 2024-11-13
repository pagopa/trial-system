import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { aTrial, aTrialOwner, aTrialSubscriber } from './data';
import { getTrialIdByTenant, insertTrial, listTrials, TrialId } from '../trial';
import { ItemAlreadyExists, ItemNotFound } from '../errors';
import { makeTestEnv } from './mocks';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

const { name, description, id } = aTrial;

describe('insertTrial', () => {
  it('should return the trial created', async () => {
    const testEnv = makeTestEnv();

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.right(aTrial));

    const actual = await insertTrial(name, description, aTrialOwner)(testEnv)();
    const expected = E.right(aTrial);

    expect(actual).toMatchObject(expected);
    expect(testEnv.trialWriter.insert).toBeCalledWith(aTrial);
  });

  it('should return two trials', async () => {
    const testEnv = makeTestEnv();

    const anotherTrial = {
      ...aTrial,
      id: 'anotherTrialId' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
    };

    testEnv.trialReader.list.mockReturnValueOnce(
      TE.right([aTrial, anotherTrial]),
    );

    const actual = await listTrials({
      pageSize: 2,
    })(testEnv)();
    const expected = E.right([aTrial, anotherTrial]);

    expect(actual).toMatchObject(expected);
  });

  it('should return trials with ID greater than 1', async () => {
    const testEnv = makeTestEnv();

    const anotherTrial2 = {
      ...aTrial,
      id: '2' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
    };
    const anotherTrial3 = {
      ...aTrial,
      id: '3' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
    };

    testEnv.trialReader.list.mockReturnValueOnce(
      TE.right([anotherTrial2, anotherTrial3]),
    );

    const actual = await listTrials({
      pageSize: 10,
      minimumId: '1' as TrialId,
    })(testEnv)();
    const expected = E.right([anotherTrial2, anotherTrial3]);

    expect(actual).toMatchObject(expected);
  });

  it('should return trials with ID less than 3', async () => {
    const testEnv = makeTestEnv();

    const anotherTrial1 = {
      ...aTrial,
      id: '1' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
    };
    const anotherTrial2 = {
      ...aTrial,
      id: '2' as TrialId,
      name: 'anotherTrialName' as NonEmptyString,
    };

    testEnv.trialReader.list.mockReturnValueOnce(
      TE.right([anotherTrial1, anotherTrial2]),
    );

    const actual = await listTrials({
      pageSize: 10,
      minimumId: '3' as TrialId,
    })(testEnv)();
    const expected = E.right([anotherTrial1, anotherTrial2]);

    expect(actual).toMatchObject(expected);
  });

  it('should return error if the trial already exists', async () => {
    const testEnv = makeTestEnv();
    const error = new ItemAlreadyExists('Trial already exists');

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await insertTrial(name, description, aTrialOwner)(testEnv)();
    const expected = E.left(error);
    expect(actual).toStrictEqual(expected);
  });

  it('should return error if something fail', async () => {
    const testEnv = makeTestEnv();
    const error = new Error('Oh No!');

    testEnv.monotonicIdFn.mockReturnValueOnce({ value: id });
    testEnv.trialWriter.insert.mockReturnValueOnce(TE.left(error));

    const actual = await insertTrial(name, description, aTrialOwner)(testEnv)();
    const expected = E.left(error);
    expect(actual).toMatchObject(expected);
  });
});

describe('getTrialIdByTenant', () => {
  it('should return the passed trial id', async () => {
    const testEnv = makeTestEnv();

    const actual = await getTrialIdByTenant(id, aTrialSubscriber)(testEnv)();
    const expected = E.right(id);
    expect(actual).toMatchObject(expected);
    expect(testEnv.trialReader.getByIdAndOwnerId).not.toHaveBeenCalled();
  });
  it('should return Left with ItemNotFound error if trial does not exist', async () => {
    const testEnv = makeTestEnv();

    testEnv.trialReader.getByIdAndOwnerId.mockReturnValueOnce(TE.right(O.none));

    const actual = await getTrialIdByTenant(id, aTrialOwner)(testEnv)();
    const expected = E.left(new ItemNotFound('Item not found'));
    expect(actual).toMatchObject(expected);
    expect(testEnv.trialReader.getByIdAndOwnerId).toHaveBeenNthCalledWith(
      1,
      id,
      aTrialOwner.id,
    );
  });
  it('should return Right with trialId', async () => {
    const testEnv = makeTestEnv();

    testEnv.trialReader.getByIdAndOwnerId.mockReturnValueOnce(
      TE.right(O.some(aTrial)),
    );

    const actual = await getTrialIdByTenant(id, aTrialOwner)(testEnv)();
    const expected = E.right(id);
    expect(actual).toMatchObject(expected);
    expect(testEnv.trialReader.getByIdAndOwnerId).toHaveBeenNthCalledWith(
      1,
      id,
      aTrialOwner.id,
    );
  });
});

import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import {
  anActivationJob,
  aTrial,
  aTrialOwner,
} from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { ItemNotFound } from '../../domain/errors';
import { getActivationJob } from '../get-activation-job';

describe('getActivationJob', () => {
  const trialId = anActivationJob.trialId;
  it('should return ItemNotFound if the trial does not exist', async () => {
    const env = makeTestEnv();

    env.trialReader.getByIdAndOwnerId.mockReturnValueOnce(TE.right(O.none));

    const actual = await getActivationJob(aTrialOwner, trialId)(env)();

    expect(actual).toStrictEqual(
      E.left(new ItemNotFound('Activation job not found')),
    );
    expect(env.trialReader.getByIdAndOwnerId).toHaveBeenNthCalledWith(
      1,
      trialId,
      aTrialOwner.id,
    );
  });

  it('should get the activation job', async () => {
    const env = makeTestEnv();

    env.trialReader.getByIdAndOwnerId.mockReturnValueOnce(
      TE.right(O.some(aTrial)),
    );
    env.activationJobReader.get.mockReturnValueOnce(
      TE.right(O.some(anActivationJob)),
    );

    const actual = await getActivationJob(aTrialOwner, trialId)(env)();

    expect(actual).toStrictEqual(E.right(O.some(anActivationJob)));
    expect(env.trialReader.getByIdAndOwnerId).toHaveBeenNthCalledWith(
      1,
      trialId,
      aTrialOwner.id,
    );
    expect(env.activationJobReader.get).toHaveBeenNthCalledWith(1, trialId);
  });
});

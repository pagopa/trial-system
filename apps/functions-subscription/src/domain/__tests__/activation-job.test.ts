import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { anActivationJob } from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { insertActivationJob } from '../activation-job';

describe('insertActivationJob', () => {
  it('should call insert as expected', async () => {
    const testEnv = makeTestEnv();
    const { trialId, usersToActivate } = anActivationJob;

    testEnv.clock.now.mockReturnValueOnce(anActivationJob.createdAt);
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

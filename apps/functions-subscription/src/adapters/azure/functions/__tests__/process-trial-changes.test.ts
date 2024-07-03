import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import { aTrial } from '../../../../domain/__tests__/data';
import { makeFunctionContext } from './mocks';
import { makeTrialChangesHandler } from '../process-trial-changes';
import { makeTestEnv } from '../../../../domain/__tests__/mocks';
import { TrialId } from '../../../../domain/trial';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

describe('makeTrialChangesHandler', () => {
  it('should not process trials on updates', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const messages = [{ ...aTrial, state: 'CREATED' as const }];

    const actual = await makeTrialChangesHandler(env)(messages, context);

    expect(env.channelAdmin.create).not.toHaveBeenCalled();
    expect(env.trialWriter.upsert).not.toHaveBeenCalled();

    expect(actual).toStrictEqual([]);
  });

  it('should fail if there is an error', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();

    const messages = [aTrial];
    const unexpectedError = new Error('Unexpected Error');

    env.channelAdmin.create.mockReturnValueOnce(TE.left(unexpectedError));

    const actual = makeTrialChangesHandler(env)(messages, context);

    expect(actual).rejects.toStrictEqual(unexpectedError);
  });

  it('should process the trials', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const creatingTrial0 = {
      ...aTrial,
      id: '0' as TrialId,
    };
    const creatingTrial1 = {
      ...aTrial,
      id: '1' as TrialId,
    };
    const createdTrial = {
      ...aTrial,
      state: 'CREATED' as const,
    };
    const creatingTrials = [creatingTrial0, creatingTrial1];
    const messages = [...creatingTrials, createdTrial];

    env.channelAdmin.create
      .mockReturnValueOnce(
        TE.right({
          identityId: 'anIdentityId-0',
          queueName: creatingTrial0.id,
        }),
      )
      .mockReturnValueOnce(
        TE.right({
          identityId: 'anIdentityId-1',
          queueName: creatingTrial1.id,
        }),
      );
    env.trialWriter.upsert
      .mockReturnValueOnce(
        TE.right({
          ...creatingTrial0,
          state: 'CREATED',
          identityId: 'anIdentityId-0' as NonEmptyString,
        }),
      )
      .mockReturnValueOnce(
        TE.right({
          ...creatingTrial1,
          state: 'CREATED',
          identityId: 'anIdentityId-1' as NonEmptyString,
        }),
      );

    const actual = await makeTrialChangesHandler(env)(messages, context);

    const expected = [
      {
        ...creatingTrial0,
        state: 'CREATED' as const,
        identityId: 'anIdentityId-0',
      },
      {
        ...creatingTrial1,
        state: 'CREATED' as const,
        identityId: 'anIdentityId-1',
      },
    ];

    expect(actual).toStrictEqual(expected);

    expect(env.trialWriter.upsert).toHaveBeenCalledTimes(creatingTrials.length);
    expect(env.trialWriter.upsert).toHaveBeenCalledWith({
      ...creatingTrial0,
      state: 'CREATED',
      identityId: 'anIdentityId-0',
    });
    expect(env.trialWriter.upsert).toHaveBeenCalledWith({
      ...creatingTrial1,
      state: 'CREATED',
      identityId: 'anIdentityId-1',
    });
  });
});

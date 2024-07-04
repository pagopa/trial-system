import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import { aCreatedTrial, aTrial } from '../../../../domain/__tests__/data';
import { makeFunctionContext } from './mocks';
import { makeTrialChangesHandler } from '../process-trial-changes';
import { makeTestEnv } from '../../../../domain/__tests__/mocks';
import { TrialId } from '../../../../domain/trial';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

describe('makeTrialChangesHandler', () => {
  it('should not process trials when state is CREATED', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const messages = [aCreatedTrial];

    const actual = await makeTrialChangesHandler(env)(messages, context);

    expect(env.channelAdmin.create).not.toHaveBeenCalled();
    expect(env.trialWriter.upsert).not.toHaveBeenCalled();

    expect(actual).toStrictEqual([]);
  });

  it('should fail when there is an error', async () => {
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
    const creatingTrials = [creatingTrial0, creatingTrial1];
    const messages = [...creatingTrials, aCreatedTrial];

    const channel0 = {
      identityId: 'anIdentityId-0' as NonEmptyString,
      queueName: creatingTrial0.id as NonEmptyString,
    };
    const channel1 = {
      identityId: 'anIdentityId-1' as NonEmptyString,
      queueName: creatingTrial0.id as NonEmptyString,
    };

    env.channelAdmin.create
      .mockReturnValueOnce(TE.right(channel0))
      .mockReturnValueOnce(TE.right(channel1));

    const createdTrial0 = {
      ...creatingTrial0,
      state: aCreatedTrial.state,
      identityId: channel0.identityId,
    };
    const createdTrial1 = {
      ...creatingTrial1,
      state: aCreatedTrial.state,
      identityId: channel1.identityId,
    };
    env.trialWriter.upsert
      .mockReturnValueOnce(TE.right(createdTrial0))
      .mockReturnValueOnce(TE.right(createdTrial1));

    const actual = await makeTrialChangesHandler(env)(messages, context);

    const expected = [createdTrial0, createdTrial1];

    expect(actual).toStrictEqual(expected);

    expect(env.trialWriter.upsert).toHaveBeenCalledTimes(creatingTrials.length);
    expect(env.trialWriter.upsert).toHaveBeenCalledWith(createdTrial0);
    expect(env.trialWriter.upsert).toHaveBeenCalledWith(createdTrial1);
  });
});

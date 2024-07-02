import { describe, expect, it } from 'vitest';
import * as TE from 'fp-ts/lib/TaskEither';
import { aTrial } from '../../../../domain/__tests__/data';
import { makeFunctionContext } from './mocks';
import { makeTrialChangesHandler } from '../process-trial-changes';
import { makeTestEnv } from '../../../../domain/__tests__/mocks';
import { TrialId } from '../../../../domain/trial';
import { anyString } from 'vitest-mock-extended';

const config = {
  servicebus: {
    namespace: 'aNamespace',
    names: {
      event: 'events',
    },
    resourceGroup: 'aResourceGroup',
    location: 'aLocation',
  },
};

describe('makeTrialChangesHandler', () => {
  it('should not process trials on updates', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();
    const messages = [{ ...aTrial, state: 'CREATED' as const }];

    const actual = await makeTrialChangesHandler({
      env,
      config,
    })(messages, context);

    expect(env.identityWriter.createOrUpdate).not.toHaveBeenCalled();
    expect(env.identityWriter.assignRole).not.toHaveBeenCalled();
    expect(env.eventQueue.createIfNotExists).not.toHaveBeenCalled();
    expect(env.eventTopic.createOrUpdateSubscription).not.toHaveBeenCalled();
    expect(env.uuidFn).not.toHaveBeenCalled();
    expect(env.trialWriter.upsert).not.toHaveBeenCalled();

    expect(actual).toStrictEqual([]);
  });

  it('should fail if there is an error', async () => {
    const env = makeTestEnv();
    const context = makeFunctionContext();

    const messages = [aTrial];
    const unexpectedError = new Error('Unexpected Error');

    env.identityWriter.createOrUpdate.mockReturnValueOnce(
      TE.left(unexpectedError),
    );

    const actual = makeTrialChangesHandler({
      env,
      config,
    })(messages, context);

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

    env.identityWriter.createOrUpdate
      .mockReturnValueOnce(
        TE.right({
          id: 'anIdentityId-0',
          principalId: 'aPrincipalId-0',
          location: 'aLocationId-0',
        }),
      )
      .mockReturnValueOnce(
        TE.right({
          id: 'anIdentityId-1',
          principalId: 'aPrincipalId-1',
          location: 'aLocationId-1',
        }),
      );

    const aQueueId = 'aQueueId';
    env.eventQueue.createIfNotExists
      .mockReturnValueOnce(TE.right({ id: aQueueId, name: creatingTrial0.id }))
      .mockReturnValueOnce(TE.right({ id: aQueueId, name: creatingTrial1.id }));

    const aSubscriptionId = 'aTopicSubscriptionId';
    env.eventTopic.createOrUpdateSubscription.mockReturnValue(
      TE.right({ id: aSubscriptionId }),
    );

    env.identityWriter.assignRole.mockReturnValue(TE.right(void 0));

    const uuid = aTrial.id;
    env.uuidFn.mockReturnValue({ value: uuid });

    env.trialWriter.upsert
      .mockReturnValueOnce(TE.right(creatingTrial0))
      .mockReturnValueOnce(TE.right(creatingTrial1));

    const actual = await makeTrialChangesHandler({
      env,
      config,
    })(messages, context);

    expect(actual).toStrictEqual([creatingTrial0, creatingTrial1]);

    expect(env.identityWriter.createOrUpdate).toHaveBeenCalledTimes(
      creatingTrials.length,
    );
    expect(env.identityWriter.createOrUpdate).toHaveBeenCalledWith(
      creatingTrial0.id,
      config.servicebus.resourceGroup,
      config.servicebus.location,
    );
    expect(env.identityWriter.createOrUpdate).toHaveBeenCalledWith(
      creatingTrial1.id,
      config.servicebus.resourceGroup,
      config.servicebus.location,
    );

    expect(env.eventQueue.createIfNotExists).toHaveBeenCalledTimes(
      creatingTrials.length,
    );
    expect(env.eventQueue.createIfNotExists).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      creatingTrial0.id,
    );
    expect(env.eventQueue.createIfNotExists).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      creatingTrial1.id,
    );

    expect(env.eventTopic.createOrUpdateSubscription).toHaveBeenCalledTimes(
      creatingTrials.length,
    );
    expect(env.eventTopic.createOrUpdateSubscription).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      creatingTrial0.id,
    );
    expect(env.eventTopic.createOrUpdateSubscription).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      creatingTrial1.id,
    );

    expect(env.uuidFn).toHaveBeenCalledTimes(creatingTrials.length);

    expect(env.identityWriter.assignRole).toHaveBeenCalledTimes(
      creatingTrials.length,
    );
    expect(env.identityWriter.assignRole).toHaveBeenCalledWith(
      aQueueId,
      uuid,
      anyString(),
      'aPrincipalId-0',
    );
    expect(env.identityWriter.assignRole).toHaveBeenCalledWith(
      aQueueId,
      uuid,
      anyString(),
      'aPrincipalId-1',
    );

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

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
    const trial = {
      ...aTrial,
      createdAt: new Date(0),
    };
    const messages = [trial];

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
    const trial = {
      ...aTrial,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };

    const messages = [trial];
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
    const createdTrial0 = {
      ...aTrial,
      id: '0' as TrialId,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    const createdTrial1 = {
      ...aTrial,
      id: '1' as TrialId,
      createdAt: new Date(1),
      updatedAt: new Date(1),
    };
    const updatedTrial = {
      ...aTrial,
      createdAt: new Date(0),
    };
    const createdTrials = [createdTrial0, createdTrial1];
    const messages = [...createdTrials, updatedTrial];

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
      .mockReturnValueOnce(TE.right({ id: aQueueId, name: createdTrial0.id }))
      .mockReturnValueOnce(TE.right({ id: aQueueId, name: createdTrial1.id }));

    const aSubscriptionId = 'aTopicSubscriptionId';
    env.eventTopic.createOrUpdateSubscription.mockReturnValue(
      TE.right({ id: aSubscriptionId }),
    );

    env.identityWriter.assignRole.mockReturnValue(TE.right(void 0));

    const updatedAt = new Date(10);
    env.clock.now.mockReturnValue(updatedAt);

    const uuid = aTrial.id;
    env.uuidFn.mockReturnValue({ value: uuid });

    env.trialWriter.upsert
      .mockReturnValueOnce(TE.right({ ...createdTrial0, updatedAt }))
      .mockReturnValueOnce(TE.right({ ...createdTrial1, updatedAt }));

    const actual = await makeTrialChangesHandler({
      env,
      config,
    })(messages, context);

    expect(actual).toStrictEqual([
      { ...createdTrial0, updatedAt },
      { ...createdTrial1, updatedAt },
    ]);

    expect(env.identityWriter.createOrUpdate).toHaveBeenCalledTimes(
      createdTrials.length,
    );
    expect(env.identityWriter.createOrUpdate).toHaveBeenCalledWith(
      createdTrial0.id,
      config.servicebus.resourceGroup,
      config.servicebus.location,
    );
    expect(env.identityWriter.createOrUpdate).toHaveBeenCalledWith(
      createdTrial1.id,
      config.servicebus.resourceGroup,
      config.servicebus.location,
    );

    expect(env.eventQueue.createIfNotExists).toHaveBeenCalledTimes(
      createdTrials.length,
    );
    expect(env.eventQueue.createIfNotExists).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      createdTrial0.id,
    );
    expect(env.eventQueue.createIfNotExists).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      createdTrial1.id,
    );

    expect(env.eventTopic.createOrUpdateSubscription).toHaveBeenCalledTimes(
      createdTrials.length,
    );
    expect(env.eventTopic.createOrUpdateSubscription).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      createdTrial0.id,
    );
    expect(env.eventTopic.createOrUpdateSubscription).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      createdTrial1.id,
    );

    expect(env.uuidFn).toHaveBeenCalledTimes(createdTrials.length);

    expect(env.identityWriter.assignRole).toHaveBeenCalledTimes(
      createdTrials.length,
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

    expect(env.trialWriter.upsert).toHaveBeenCalledTimes(createdTrials.length);
    expect(env.trialWriter.upsert).toHaveBeenCalledWith({
      ...createdTrial0,
      updatedAt,
      state: 'CREATED',
      identityId: 'anIdentityId-0',
    });
    expect(env.trialWriter.upsert).toHaveBeenCalledWith({
      ...createdTrial1,
      updatedAt,
      state: 'CREATED',
      identityId: 'anIdentityId-1',
    });
  });
});

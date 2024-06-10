import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import {
  anActivationJob,
  anActivationRequest,
} from '../../domain/__tests__/data';
import { makeTestEnv } from '../../domain/__tests__/mocks';
import { Capabilities } from '../../domain/capabilities';
import { processActivationJob } from '../process-activation-job';

describe('processActivationJob', () => {
  const chunkSize = 99;
  const fetchSize = 100;
  it('should activate when there are many chunk of activation requests', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    // Creating an array of many requests; every element has a different id
    const activationRequests = Array.from({ length: fetchSize }, (_, i) => ({
      ...anActivationRequest,
      id: `${i}`,
    }));

    const chunks = RA.chunksOf(chunkSize)(activationRequests);

    mockEnv.activationConsumer.fetchActivationRequestItemsToActivate.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationConsumer.activateRequestItems.mockReturnValue(
      TE.right('success' as const),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    const expected = E.right(['success', 'success']);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledTimes(chunks.length);
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledWith(
      anActivationJob.id,
      anActivationJob.trialId,
      chunks[0],
    );
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledWith(
      anActivationJob.id,
      anActivationJob.trialId,
      chunks[1],
    );
  });
  it('should activate when there is at least an activation request', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    const activationRequests = [anActivationRequest];
    mockEnv.activationConsumer.fetchActivationRequestItemsToActivate.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationConsumer.activateRequestItems.mockReturnValue(
      TE.right('success' as const),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    const expected = E.right(['success']);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenNthCalledWith(
      1,
      anActivationJob.id,
      anActivationJob.trialId,
      activationRequests,
    );
  });
  it('should activate just one batch when one succeed and one fail', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    const requests = Array.from({ length: fetchSize }, (_, i) => ({
      ...anActivationRequest,
      id: `${i}`,
    }));
    const activationRequests = RA.append({
      ...anActivationRequest,
      id: 'anotherId',
    })(requests);
    const chunks = RA.chunksOf(chunkSize)(activationRequests);
    mockEnv.activationConsumer.fetchActivationRequestItemsToActivate.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationConsumer.activateRequestItems
      .mockReturnValueOnce(TE.right('success' as const))
      .mockReturnValueOnce(TE.right('fail' as const));

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    const expected = E.right(['success', 'fail']);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledTimes(2);
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledWith(
      anActivationJob.id,
      anActivationJob.trialId,
      chunks[0],
    );
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledWith(
      anActivationJob.id,
      anActivationJob.trialId,
      chunks[1],
    );
  });
  it('should not activate when there are no activation requests', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.activationConsumer.fetchActivationRequestItemsToActivate.mockReturnValueOnce(
      TE.right([]),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    const expected = E.right([]);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledTimes(0);
  });
  it('should return an error when the fetch fail', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;
    const unexpectedError = new Error('Unexpected error');

    mockEnv.activationConsumer.fetchActivationRequestItemsToActivate.mockReturnValueOnce(
      TE.left(unexpectedError),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    const expected = E.left(unexpectedError);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationConsumer.activateRequestItems,
    ).toHaveBeenCalledTimes(0);
  });
});

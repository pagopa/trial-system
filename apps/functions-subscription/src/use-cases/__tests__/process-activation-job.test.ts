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
  const fetchSize = 100;
  it('should activate when there are many chunk of activation requests', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    // Creating an array of many requests; every element has a different id
    const activationRequests = Array.from({ length: fetchSize }, (_, i) => ({
      ...anActivationRequest,
      id: `${i}`,
    }));

    mockEnv.activationRequestRepository.list.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationRequestRepository.activate.mockReturnValue(
      TE.right('success' as const),
    );

    const actual = await processActivationJob(
      anActivationJob,
      fetchSize,
    )(testEnv)();
    const expected = E.right('success');

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.activationRequestRepository.activate).toHaveBeenCalledWith(
      anActivationJob,
      activationRequests,
    );
  });
  it('should activate when there is at least an activation request', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    const activationRequests = [anActivationRequest];
    mockEnv.activationRequestRepository.list.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationRequestRepository.activate.mockReturnValue(
      TE.right(['success'] as const),
    );

    const actual = await processActivationJob(
      anActivationJob,
      fetchSize,
    )(testEnv)();
    const expected = E.right(['success']);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationRequestRepository.activate,
    ).toHaveBeenNthCalledWith(1, anActivationJob, activationRequests);
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
    mockEnv.activationRequestRepository.list.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationRequestRepository.activate
      .mockReturnValueOnce(TE.right('success' as const))
      .mockReturnValueOnce(TE.right('fail' as const));

    const actual = await processActivationJob(
      anActivationJob,
      fetchSize,
    )(testEnv)();
    const expected = E.right('success');

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.activationRequestRepository.activate).toHaveBeenCalledWith(
      anActivationJob,
      activationRequests,
    );
  });
  it('should return success when there are no activation requests', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.activationRequestRepository.list.mockReturnValueOnce(TE.right([]));

    const actual = await processActivationJob(
      anActivationJob,
      fetchSize,
    )(testEnv)();
    const expected = E.right('success');

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.activationRequestRepository.activate).toHaveBeenCalledTimes(
      0,
    );
  });
  it('should return an error when the fetch fail', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;
    const unexpectedError = new Error('Unexpected error');

    mockEnv.activationRequestRepository.list.mockReturnValueOnce(
      TE.left(unexpectedError),
    );

    const actual = await processActivationJob(
      anActivationJob,
      fetchSize,
    )(testEnv)();
    const expected = E.left(unexpectedError);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.activationRequestRepository.activate).toHaveBeenCalledTimes(
      0,
    );
  });
});

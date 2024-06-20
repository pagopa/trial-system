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
import { ActivationRequestId } from '../../domain/activation-request';
import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';

describe('processActivationJob', () => {
  const maxFetchSize = 100;
  it('should activate only the elements defined by the job', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    const activationJob = {
      ...anActivationJob,
      usersToActivate: 2 as NonNegativeInteger,
    };

    const fetchSize = activationJob.usersToActivate;

    // Creating an array of requests; every element has a different id
    const activationRequests = Array.from({ length: fetchSize }, (_, i) => ({
      ...anActivationRequest,
      id: `${i}` as ActivationRequestId,
    }));

    mockEnv.activationRequestRepository.list.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationRequestRepository.activate.mockReturnValue(
      TE.right('success' as const),
    );

    const actual = await processActivationJob(
      activationJob,
      maxFetchSize,
    )(testEnv)();
    const expected = E.right('success');

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.activationRequestRepository.list).toHaveBeenCalledWith(
      activationJob.trialId,
      fetchSize,
    );
    expect(mockEnv.activationRequestRepository.activate).toHaveBeenCalledWith(
      activationJob,
      activationRequests,
    );
  });
  it(`should activate only ${maxFetchSize} elements`, async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    const activationJob = {
      ...anActivationJob,
      usersToActivate: (maxFetchSize * 2) as NonNegativeInteger,
    };

    // Creating an array of requests; every element has a different id
    const activationRequests = Array.from({ length: maxFetchSize }, (_, i) => ({
      ...anActivationRequest,
      id: `${i}` as ActivationRequestId,
    }));

    mockEnv.activationRequestRepository.list.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationRequestRepository.activate.mockReturnValue(
      TE.right('success' as const),
    );

    const actual = await processActivationJob(
      activationJob,
      maxFetchSize,
    )(testEnv)();
    const expected = E.right('success');

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.activationRequestRepository.list).toHaveBeenCalledWith(
      activationJob.trialId,
      maxFetchSize,
    );
    expect(mockEnv.activationRequestRepository.activate).toHaveBeenCalledWith(
      activationJob,
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
      TE.right('success'),
    );

    const actual = await processActivationJob(
      anActivationJob,
      maxFetchSize,
    )(testEnv)();
    const expected = E.right('success');

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationRequestRepository.activate,
    ).toHaveBeenNthCalledWith(1, anActivationJob, activationRequests);
  });
  it('should activate just one batch when one succeed and one fail', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    const requests = Array.from({ length: maxFetchSize }, (_, i) => ({
      ...anActivationRequest,
      id: `${i}` as ActivationRequestId,
    }));
    const activationRequests = RA.append({
      ...anActivationRequest,
      id: 'anotherId' as ActivationRequestId,
    })(requests);
    mockEnv.activationRequestRepository.list.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationRequestRepository.activate
      .mockReturnValueOnce(TE.right('success' as const))
      .mockReturnValueOnce(TE.right('fail' as const));

    const actual = await processActivationJob(
      anActivationJob,
      maxFetchSize,
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
    mockEnv.activationRequestRepository.activate.mockReturnValueOnce(
      TE.right('success' as const),
    );

    const actual = await processActivationJob(
      anActivationJob,
      maxFetchSize,
    )(testEnv)();
    const expected = E.right('success');

    expect(actual).toStrictEqual(expected);
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
      maxFetchSize,
    )(testEnv)();
    const expected = E.left(unexpectedError);

    expect(actual).toStrictEqual(expected);
    expect(mockEnv.activationRequestRepository.activate).toHaveBeenCalledTimes(
      0,
    );
  });
});

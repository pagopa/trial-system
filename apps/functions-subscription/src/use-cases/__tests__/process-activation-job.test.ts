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
  const chunkSize = 1;
  it.skip('should activate when there are many chunk of activation requests ', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    // Creating an array of many requests
    const activationRequests = Array.from(
      { length: chunkSize + 1 },
      () => anActivationRequest,
    );

    const chunks = RA.chunksOf(chunkSize)(activationRequests);

    mockEnv.activationService.fetchActivationRequestsToActivate.mockReturnValueOnce(
      TE.right(activationRequests),
    );
    mockEnv.activationService.activateActivationRequests.mockReturnValue(
      TE.right('ok'),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    // TODO: Change the expected value
    const expected = E.right('ok');

    // expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationService.activateActivationRequests,
    ).toHaveBeenCalledTimes(chunks.length);
  });
  it.skip('should activate when there is at least an activation request ', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.activationService.fetchActivationRequestsToActivate.mockReturnValueOnce(
      TE.right([anActivationRequest]),
    );
    mockEnv.activationService.activateActivationRequests.mockReturnValueOnce(
      TE.right('ok'),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    // TODO: Change the expected value
    const expected = E.right('ok');

    // expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationService.activateActivationRequests,
    ).toHaveBeenNthCalledWith(1, [anActivationRequest]);
  });
  it.skip('should not activate when there are no activation requests ', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;

    mockEnv.activationService.fetchActivationRequestsToActivate.mockReturnValueOnce(
      TE.right([]),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    const expected = E.right([]);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationService.activateActivationRequests,
    ).toHaveBeenCalledTimes(0);
  });
  it.skip('should return an error when the fetch fail', async () => {
    const mockEnv = makeTestEnv();
    const testEnv = mockEnv as unknown as Capabilities;
    const unexpectedError = new Error('Unexpected error');

    mockEnv.activationService.fetchActivationRequestsToActivate.mockReturnValueOnce(
      TE.left(unexpectedError),
    );

    const actual = await processActivationJob(
      anActivationJob,
      chunkSize,
    )(testEnv)();
    const expected = E.left(unexpectedError);

    expect(actual).toStrictEqual(expected);
    expect(
      mockEnv.activationService.activateActivationRequests,
    ).toHaveBeenCalledTimes(0);
  });
});

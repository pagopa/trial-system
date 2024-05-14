import { describe, expect, it, vi } from 'vitest';
import * as E from 'fp-ts/lib/Either';

import { Container } from '@azure/cosmos';
import { Trial, RetrievedTrial, TrialModel } from '../trial';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

const aTrial: Trial = {
  id: 'aTrialID' as NonEmptyString,
  name: 'aTrialName' as NonEmptyString,
  isEnabled: true,
};

const aRetrievedTrial: RetrievedTrial = {
  ...aTrial,
  _etag: '_etag',
  _rid: '_rid',
  _self: '_self',
  _ts: 1,
};

const mockFetchAll = vi.fn();
const mockGetAsyncIterator = vi.fn();
const mockUpsert = vi.fn();

const containerMock = {
  items: {
    readAll: vi.fn(() => ({
      fetchAll: mockFetchAll,
      getAsyncIterator: mockGetAsyncIterator,
    })),
    upsert: mockUpsert,
    query: vi.fn(() => ({
      fetchAll: mockFetchAll,
    })),
  },
} as unknown as Container;

describe('trial', () => {
  it('GIVEN a valid trial object WHEN the object is decode THEN the decode succeed', async () => {
    const result = Trial.decode(aTrial);
    expect(E.isRight(result)).toBeTruthy();
  });

  it('GIVEN an invalid trial without a name WHEN the object is decoded THEN the decode fails', async () => {
    const result = Trial.decode({
      ...Trial,
      name: undefined,
    });
    expect(E.isLeft(result)).toBeTruthy();
  });
});

describe('upsert', () => {
  it('GIVEN a valid trial WHEN the client upsert is called THEN the create return a Right', async () => {
    mockUpsert.mockImplementationOnce(() =>
      Promise.resolve({
        resource: { ...aRetrievedTrial },
      }),
    );
    const model = new TrialModel(containerMock);
    const result = await model.upsert(aTrial)();
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      JSON.parse(JSON.stringify(aTrial)),
      expect.objectContaining({}),
    );
    expect(E.isRight(result)).toBeTruthy();
  });

  it('GIVEN an invalid trial WHEN the client upsert is called THEN the create return a Left', async () => {
    const model = new TrialModel(containerMock);
    const result = await model.upsert({
      ...aTrial,
      name: undefined,
    } as unknown as Trial)();
    expect(mockUpsert).toHaveBeenCalled();
    expect(E.isLeft(result)).toBeTruthy();
  });
});

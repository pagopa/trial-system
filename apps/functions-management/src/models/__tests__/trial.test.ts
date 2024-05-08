import * as E from "fp-ts/lib/Either";

import { Container } from "@azure/cosmos";
import {
  Trial,
  RetrievedTrial,
  TrialModel
} from "../trial";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { pipe } from "fp-ts/lib/function";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

const aTrial: Trial = {
  id: "aTrialID" as NonEmptyString,
  name: "aTrialName" as NonEmptyString,
  isEnabled: true
};

const aRetrievedTrial: RetrievedTrial = {
  ...aTrial,
  _etag: "_etag",
  _rid: "_rid",
  _self: "_self",
  _ts: 1
};

const mockFetchAll = jest.fn();
const mockGetAsyncIterator = jest.fn();
const mockUpsert = jest.fn();

const containerMock = ({
  items: {
    readAll: jest.fn(() => ({
      fetchAll: mockFetchAll,
      getAsyncIterator: mockGetAsyncIterator
    })),
    upsert: mockUpsert,
    query: jest.fn(() => ({
      fetchAll: mockFetchAll
    }))
  }
} as unknown) as Container;

const aNoticeNumber = "177777777777777777";

describe("trial", () => {
  it("GIVEN a valid trial object WHEN the object is decode THEN the decode succeed", async () => {
    const result = Trial.decode(aTrial);
    expect(E.isRight(result)).toBeTruthy();
  });


  it("GIVEN an invalid trial without a name WHEN the object is decoded THEN the decode fails", async () => {

    const result = Trial.decode({
      ...Trial,
      name: undefined
    });
    expect(E.isLeft(result)).toBeTruthy();
  });
});

describe("upsert", () => {
  it("GIVEN a valid trial WHEN the client upsert is called THEN the create return a Right", async () => {
    mockUpsert.mockImplementationOnce((_, __) =>
      Promise.resolve({
        resource: { ...aRetrievedTrial }
      })
    );
    const model = new TrialModel(containerMock);
    const result = await model.upsert(aTrial)();
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      JSON.parse(JSON.stringify(aTrial)),
      expect.objectContaining({})
    );
    console.log(result);
    expect(E.isRight(result)).toBeTruthy();
  });

  it("GIVEN an invalid trial WHEN the client upsert is called THEN the create return a Left", async () => {
    const model = new TrialModel(containerMock);
    const result = await model.upsert({...aTrial, name: undefined} as any)();
    expect(mockUpsert).toHaveBeenCalled();
    expect(E.isLeft(result)).toBeTruthy();
  });
});

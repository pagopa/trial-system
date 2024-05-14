import { describe, expect, it, vi } from "vitest";
import { makeCreateTrialHandler } from "../createTrial";
import { httpHandlerInputMocks } from "../__mocks__/handlerMocks";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { TrialModel } from "../../../../models/trial";
import * as H from "@pagopa/handler-kit";
import { CreateTrial } from "../../../../generated/definitions/internal/CreateTrial";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

const upsertMock = vi.fn();
const trialModelMock = ({
  upsert: upsertMock
} as unknown) as TrialModel;

const aValidBodyPayload: CreateTrial = {
  name: "TrialName" as NonEmptyString
};

const upsertedItem = {
  ...aValidBodyPayload,
  isEnabled: true,
  id: "TrialID" as NonEmptyString
};

describe("Create Trial handler", () => {
  it("should return bad request if request body is malformed", async () => {
    const mockReq: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      body: { foo: "abc" }
    };
    const result = await makeCreateTrialHandler({
      ...httpHandlerInputMocks,
      input: mockReq,
      trialModel: trialModelMock
    })();
    expect(upsertMock).not.toHaveBeenCalled();
    expect(E.isRight(result)).toEqual(true);
    expect(result).toMatchObject({
      right: {
        statusCode: 400,
        body: { status: 400, title: "Missing or invalid body" }
      }
    });
  });

  it("should return Internal Server error if upsert fails", async () => {
    const mockReq: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      body: aValidBodyPayload
    };
    upsertMock.mockImplementationOnce(() => TE.left("Cannot upsert item"));
    const result = await makeCreateTrialHandler({
      ...httpHandlerInputMocks,
      input: mockReq,
      trialModel: trialModelMock
    })();
    expect(upsertMock).toHaveBeenCalled();
    expect(E.isRight(result)).toEqual(true);
    expect(result).toMatchObject({
      right: {
        statusCode: 500,
        body: {
          status: 500,
          title: "An error occurred saving Trial: [Cannot upsert item]"
        }
      }
    });
  });

  it("should return 200 Success if upsert works", async () => {
    const mockReq: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      body: aValidBodyPayload
    };
    upsertMock.mockImplementationOnce(() => TE.right(upsertedItem));
    const result = await makeCreateTrialHandler({
      ...httpHandlerInputMocks,
      input: mockReq,
      trialModel: trialModelMock
    })();
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ ...aValidBodyPayload })
    );
    expect(E.isRight(result)).toEqual(true);
    expect(result).toMatchObject({
      right: {
        statusCode: 200,
        body: {
          trialId: upsertedItem.id,
          isEnabled: upsertedItem.isEnabled
        }
      }
    });
  });
});

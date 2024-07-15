import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { createClient } from "./generated/definitions/trial/client";
import * as t from "io-ts";
import { getConfigOrThrow } from "./utils/config";
import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as RA from "fp-ts/ReadonlyArray";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { CreateSubscriptionStateEnum } from "./generated/definitions/trial/CreateSubscriptionState";
import { retriableTaskEither } from "./utils/retry";

const ScriptConfig = t.type({
  TRIAL_ID: NonEmptyString,
  TRIAL_API_BASE_URL: NonEmptyString,
  TRIAL_APIM_SUBSCRIPTION_KEY: NonEmptyString,
  USER_FILE_PATH: withDefault(
    NonEmptyString,
    "../../.data/users.csv" as NonEmptyString
  )
});
type ScriptConfig = t.TypeOf<typeof ScriptConfig>;

const UsersArray = t.readonlyArray(t.readonlyArray(NonEmptyString));
type UsersArray = t.TypeOf<typeof UsersArray>;

const config = getConfigOrThrow(ScriptConfig, process.env);

const trialClient = createClient<"ApiKeyAuth">({
  basePath: "",
  baseUrl: config.TRIAL_API_BASE_URL,
  fetchApi: fetch,
  withDefaults: op => params =>
    op({
      ...params,
      ApiKeyAuth: config.TRIAL_APIM_SUBSCRIPTION_KEY
    })
});

export const runMassiveActivation = pipe(
  console.log(`Read CSV users file from ${config.USER_FILE_PATH}`),
  () => fs.readFileSync(config.USER_FILE_PATH),
  userFileBuffer =>
    parse(userFileBuffer, {
      skip_empty_lines: true,
      columns: false,
      from_line: 2
    }),
  UsersArray.decode,
  E.mapLeft(errs => Error(errorsToReadableMessages(errs).join("|"))),
  E.chain(
    E.fromPredicate(RA.isNonEmpty, () =>
      Error("No users to activate from user's file")
    )
  ),
  E.map(RA.flatten),
  E.bindTo("users"),
  E.bind("trialClient", () => E.of(trialClient)),
  E.map(({ trialClient, users }) =>
    pipe(
      users,
      RA.map(userId =>
        pipe(
          TE.tryCatch(
            () =>
              trialClient.createSubscription({
                trialId: config.TRIAL_ID,
                body: {
                  userId,
                  state: CreateSubscriptionStateEnum.ACTIVE
                }
              }),
            E.toError
          ),
          TE.chain(
            flow(
              E.mapLeft(errs =>
                Error(errorsToReadableMessages(errs).join("|"))
              ),
              TE.fromEither,
              TE.filterOrElse(
                res => res.status !== 500,
                () => Error("Error while calling createSubscription API")
              )
            )
          ),
          createTe =>
            TE.tryCatch(
              () => retriableTaskEither(5, 1000)(createTe),
              E.toError
            ),
          TE.chain(TE.fromEither),
          TE.chain(res => TE.fromTask(T.delay(200)(T.of(res)))),
          TE.map(res => {
            console.log(
              `Activating user ${userId} on trial ${config.TRIAL_ID} => response ${res.status}`
            );
            return res;
          })
        )
      ),
      RA.sequence(TE.ApplicativeSeq),
      TE.map(() => "Success!")
    )
  ),
  E.getOrElseW(() => TE.of(void 0)),
  TE.toUnion
);

runMassiveActivation()
  .then(console.log)
  .catch(console.error);

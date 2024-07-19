import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { createClient } from './generated/definitions/trial/client';
import * as t from 'io-ts';
import { parseConfigOrThrow } from './parse-config';
import { flow, pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import { withDefault } from '@pagopa/ts-commons/lib/types';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { errorsToReadableMessages } from '@pagopa/ts-commons/lib/reporters';
import { CreateSubscriptionStateEnum } from './generated/definitions/trial/CreateSubscriptionState';

const EnvsCodec = t.type({
  TRIAL_ID: NonEmptyString,
  TRIAL_API_BASE_URL: NonEmptyString,
  TRIAL_APIM_SUBSCRIPTION_KEY: NonEmptyString,
  USER_FILE_PATH: withDefault(
    NonEmptyString,
    '../../.data/users.csv' as NonEmptyString,
  ),
});

const UserListCodec = t.readonlyArray(t.readonlyArray(NonEmptyString));

const config = parseConfigOrThrow(EnvsCodec, process.env);

const trialClient = createClient<'ApiKeyAuth'>({
  basePath: '',
  baseUrl: config.TRIAL_API_BASE_URL,
  fetchApi: fetch,
  withDefaults: (op) => (params) =>
    op({
      ...params,
      ApiKeyAuth: config.TRIAL_APIM_SUBSCRIPTION_KEY,
    }),
});

export const runMassiveActivation = pipe(
  console.log(`Read CSV users file from ${config.USER_FILE_PATH}`),
  () => fs.readFileSync(config.USER_FILE_PATH),
  (userFileBuffer) =>
    parse(userFileBuffer, {
      skip_empty_lines: true,
      columns: false,
      from_line: 1,
    }),
  UserListCodec.decode,
  E.mapLeft((errs) => Error(errorsToReadableMessages(errs).join('|'))),
  E.chain(
    E.fromPredicate(RA.isNonEmpty, () =>
      Error("No users to activate from user's file"),
    ),
  ),
  E.map(RA.flatten),
  E.map((users) =>
    pipe(
      users,
      RA.traverse(TE.ApplicativeSeq)((userId) =>
        pipe(
          TE.tryCatch(
            () =>
              trialClient.createSubscription({
                trialId: config.TRIAL_ID,
                body: {
                  userId,
                  state: CreateSubscriptionStateEnum.ACTIVE,
                },
              }),
            E.toError,
          ),
          TE.chain(
            flow(
              E.mapLeft((errs) =>
                Error(errorsToReadableMessages(errs).join('|')),
              ),
              TE.fromEither,
              TE.filterOrElse(
                (res) => res.status !== 500,
                () => Error('Error while calling createSubscription API'),
              ),
            ),
          ),
          TE.map((res) => {
            console.log(
              `Activating user ${userId} on trial ${config.TRIAL_ID} => response ${res.status}`,
            );
            return res;
          }),
        ),
      ),
      TE.map(() => 'Success!'),
    ),
  ),
  E.getOrElseW(() => TE.of(void 0)),
  TE.toUnion,
);

runMassiveActivation().then(console.log).catch(console.error);

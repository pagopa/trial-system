import { pipe } from 'fp-ts/lib/function';
import * as H from '@pagopa/handler-kit';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';

import { httpAzureFunction } from '@pagopa/handler-kit-azure-func';
import { RetrievedTrial, Trial } from '../../../models/trial';
import { RequiredBodyMiddleware } from '../../../middlewares/request';
import { CreateTrial } from '../../../generated/definitions/internal/CreateTrial';
import { TrialModelDependency } from '../../../utils/trials/dependency';
import { ulid } from 'ulid';
import { CreatedTrial } from '../../../generated/definitions/internal/CreatedTrial';

export const storeNewTrial: (
  createTrialBody: CreateTrial,
) => RTE.ReaderTaskEither<TrialModelDependency, H.HttpError, RetrievedTrial> =
  (createTrialBody: CreateTrial) =>
  ({ trialModel }) =>
    pipe(
      { ...createTrialBody, id: ulid() },
      Trial.decode,
      E.mapLeft(
        (errs) =>
          new H.HttpError(`Cannot decode Trial model: [${errs.join('|')}]`),
      ),
      TE.fromEither,
      TE.chain((model) =>
        pipe(
          trialModel.upsert(model),
          TE.mapLeft(
            (err) =>
              new H.HttpError(
                `An error occurred saving Trial: [${String(err)}]`,
              ),
          ),
        ),
      ),
    );

export const makeCreateTrialHandler: H.Handler<
  H.HttpRequest,
  | H.HttpResponse<CreatedTrial, 200>
  | H.HttpResponse<H.ProblemJson, H.HttpErrorStatusCode>,
  TrialModelDependency
> = H.of((req: H.HttpRequest) =>
  pipe(
    req,
    RequiredBodyMiddleware(CreateTrial),
    RTE.fromTaskEither,
    RTE.chain(storeNewTrial),
    RTE.map((savedTrial) =>
      H.successJson({
        trialId: savedTrial.id,
        isEnabled: savedTrial.isEnabled,
      }),
    ),
    RTE.orElseW((httpError) =>
      RTE.right(
        H.problemJson({ status: httpError.status, title: httpError.message }),
      ),
    ),
  ),
);

export const CreateTrialFunction = httpAzureFunction(makeCreateTrialHandler);

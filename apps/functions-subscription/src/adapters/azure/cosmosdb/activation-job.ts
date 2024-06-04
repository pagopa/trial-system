import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { InvocationContext } from '@azure/functions';
import { ActivationCodec } from '../../../domain/activation';

export const makeActivationCosmosDBHandler =
  () =>
  (
    documents: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: InvocationContext,
  ): Promise<readonly unknown[]> =>
    pipe(
      TE.fromEither(t.array(ActivationCodec).decode(documents)),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();

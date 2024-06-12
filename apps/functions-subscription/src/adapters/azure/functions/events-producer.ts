import * as t from 'io-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { InvocationContext } from '@azure/functions';
import { Capabilities } from '../../../domain/capabilities';
import { SubscriptionHistoryCodec } from '../../../domain/subscription-history';
import { makeSubscriptionFromHistory } from '../../../domain/subscription';

export const makeEventsProducerCosmosDBHandler =
  (env: Pick<Capabilities, 'eventWriter'>) =>
  (
    documents: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: InvocationContext,
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ): Promise<readonly void[]> =>
    pipe(
      TE.fromEither(t.array(SubscriptionHistoryCodec).decode(documents)),
      // extract from subscription-history a subscription entity
      TE.chainW(TE.traverseArray(flow(makeSubscriptionFromHistory, TE.of))),
      // send the event
      TE.chainW(TE.traverseArray(env.eventWriter.send)),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();

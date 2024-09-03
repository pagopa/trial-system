import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import {
  ItemResponse,
  ItemDefinition,
  FeedResponse,
  OperationResponse,
} from '@azure/cosmos';

const resourceDecode =
  <A, O>(codec: t.Type<A, O>) =>
  <T extends { readonly id?: string }>(resource: T | undefined) =>
    pipe(
      O.fromNullable(resource),
      O.map(codec.decode),
      // transform Option<Either<L, R>> => Either<L, Option<R>>
      O.sequence(E.Applicative),
      E.mapLeft(
        () =>
          new Error(
            `Unable to parse the ${resource?.id} using codec ${codec.name}`,
          ),
      ),
    );

export const decodeFromItem =
  <A, O>(codec: t.Type<A, O>) =>
  <T extends ItemDefinition>(item: ItemResponse<T>) =>
    resourceDecode(codec)(item.resource);

export const decodeFromOperationResponse =
  <A, O>(codec: t.Type<A, O>) =>
  (item: OperationResponse) =>
    resourceDecode(codec)(item.resourceBody);

export const decodeFromFeed =
  <A, O>(codec: t.Type<A, O>) =>
  <T extends FeedResponse<unknown>>(list: T) =>
    pipe(
      list.resources,
      t.array(codec).decode,
      E.mapLeft(
        () =>
          new Error(`Unable to parse the resources using codec ${codec.name}`),
      ),
    );

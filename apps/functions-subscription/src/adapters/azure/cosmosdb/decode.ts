import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { ItemResponse, ItemDefinition } from '@azure/cosmos';

export const decodeFromItem =
  <A, O, T extends ItemDefinition>(codec: t.Type<A, O>) =>
  (item: ItemResponse<T>) =>
    pipe(
      O.fromNullable(item.resource),
      O.map(codec.decode),
      // transform Option<Either<L, R>> => Either<L, Option<R>>
      O.sequence(E.Applicative),
      E.mapLeft(
        () =>
          new Error(
            `Unable to parse the ${item.resource?.id} using codec ${codec.name}`,
          ),
      ),
    );
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";

export const retriableTaskEither = (retryNum: number, fixedDelay: number) => async <E, O>(te: TE.TaskEither<E, O>) => {
    let res: E.Either<E,O> = await te();
    let isOk = E.isRight(res);
    let i = 2;
    while (i <= retryNum && !isOk){
      await TE.fromTask(T.delay(fixedDelay)(T.of(void 0)))();
      res = await te();
      isOk = E.isRight(res);
      i++;
    }
    return res;
}
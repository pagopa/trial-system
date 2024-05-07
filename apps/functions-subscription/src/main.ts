import { getConfigOrThrow } from "./config";
import { InfoFunction } from "./functions/info";

const config = getConfigOrThrow();

export const Info = InfoFunction({});

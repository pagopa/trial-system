import { ErrorResponse } from '@azure/cosmos';
import { ItemAlreadyExists, ItemNotFound } from '../../../domain/errors';

export const cosmosErrorToDomainError = (error: Error) => {
  if (error instanceof ErrorResponse)
    if (error.code === 409)
      return new ItemAlreadyExists(
        `The item already exists; original error body: ${error.body}`,
      );
    else if (error.code === 404)
      return new ItemNotFound(
        `The item was not found; original error body: ${error.body}`,
      );
    else return error;
  else return error;
};

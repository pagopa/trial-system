import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import * as H from '@pagopa/handler-kit';
import { describe, expect, it } from 'vitest';
import {
  getAndValidateUser,
  parseQueryParameter,
  parseRequestBody,
} from '../middleware';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

const DummySchema = t.type({
  name: t.string,
});
type DummySchema = t.TypeOf<typeof DummySchema>;
const aValidBody: DummySchema = {
  name: 'Anakin Skywalker',
};
const aValidQuery = {
  name: 'Anakin Skywalker',
};

const aValidRequest = H.request('https://function/anEndpoint');

describe('parseRequestBody', () => {
  it('should return a parsed body', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      body: aValidBody,
    };
    const actual = parseRequestBody(DummySchema)(req);
    expect(actual).toStrictEqual(E.right({ name: 'Anakin Skywalker' }));
  });

  it('should return an error because the body is not valid', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      body: {},
    };
    const actual = parseRequestBody(DummySchema)(req);
    expect(E.isLeft(actual)).toStrictEqual(true);
  });
});

describe('parseQueryParameter', () => {
  it('should return a parsed property', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      query: aValidQuery,
    };
    const actual = parseQueryParameter(NonEmptyString, 'name')(req);
    expect(actual).toStrictEqual(E.right('Anakin Skywalker'));
  });

  it('should return an error because the query parameter is not valid', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      query: {},
    };
    const actual = parseQueryParameter(NonEmptyString, 'name')(req);
    expect(E.isLeft(actual)).toStrictEqual(true);
  });
});

describe('getAndValidateUser', () => {
  it('should return Left if the header are missing', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      headers: {},
    };
    const actual = getAndValidateUser(['ApiTrialManager'])(req);
    const expected = new H.HttpBadRequestError('Missing x-user-id header');
    expect(actual).toStrictEqual(E.left(expected));
  });
  it('should return Left if the `x-user-groups` header is missing', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      headers: {
        'x-user-id': 'aUserId',
        'x-user-groups': '',
      },
    };
    const actual = getAndValidateUser(['ApiTrialManager'])(req);
    const expected = new H.HttpBadRequestError(
      'Invalid format of x-user-groups parameter',
    );
    expect(actual).toStrictEqual(E.left(expected));
  });
  it('should return Left if the `x-user-groups` header does not contain any of the given groups', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      headers: {
        'x-user-id': 'aUserId',
        'x-user-groups': 'anotherUserGroup',
      },
    };
    const actual = getAndValidateUser(['ApiTrialManager'])(req);
    const expected = new H.HttpForbiddenError(
      'Missing required group: ApiTrialManager',
    );
    expect(actual).toStrictEqual(E.left(expected));
  });
  it('should return Right when the `x-user-id` header and the `x-user-groups` header are present', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      headers: {
        'x-user-id': 'aUserId',
        'x-user-groups': 'ApiTrialUser,ApiTrialManager',
      },
    };
    const actual = getAndValidateUser(['ApiTrialManager'])(req);
    const expected = {
      id: 'aUserId',
      type: 'owner',
    };
    expect(actual).toStrictEqual(E.right(expected));
  });
});

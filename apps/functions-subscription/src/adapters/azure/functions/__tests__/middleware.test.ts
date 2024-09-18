import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import * as H from '@pagopa/handler-kit';
import { describe, expect, it } from 'vitest';
import { parseRequestBody, verifyUserGroup } from '../middleware';

const DummySchema = t.type({
  name: t.string,
});
type DummySchema = t.TypeOf<typeof DummySchema>;
const aValidBody: DummySchema = {
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

describe('verifyUserGroup', () => {
  it('should return Left if the `x-user-groups` header does not contain any of the given groups', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      headers: {
        'x-user-groups': 'aGroup,anAnotherGroup',
      },
    };
    const actual = verifyUserGroup(['ApiTrialManager', 'ApiTrialUser'])(req);
    const expected = new H.HttpForbiddenError(
      `Missing required group: ApiTrialManager,ApiTrialUser`,
    );
    expect(actual).toStrictEqual(E.left(expected));
  });

  it('should return Right if the `x-user-groups` header is missing', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
    };
    const actual = verifyUserGroup(['ApiTrialManager', 'ApiTrialUser'])(req);
    expect(actual).toStrictEqual(E.right(void 0));
  });

  it('should return Right if the `x-user-groups` header contains the given group', async () => {
    const req: H.HttpRequest = {
      ...aValidRequest,
      headers: {
        'x-user-groups': 'aGroup,ApiTrialManager,anAnotherGroup',
      },
    };
    const actual = verifyUserGroup(['ApiTrialManager', 'ApiTrialUser'])(req);
    expect(actual).toStrictEqual(E.right(void 0));
  });
});

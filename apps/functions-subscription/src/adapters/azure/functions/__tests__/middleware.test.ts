import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import * as H from '@pagopa/handler-kit';
import { describe, expect, it } from 'vitest';
import { parseRequestBody } from '../middleware';

const DummySchema = t.type({
  name: t.string,
});
type DummySchema = t.TypeOf<typeof DummySchema>;
const aValidBody: DummySchema = {
  name: 'Anakin Skywalker',
};

const aValidRequest: H.HttpRequest = H.request('https://function/anEndpoint');

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

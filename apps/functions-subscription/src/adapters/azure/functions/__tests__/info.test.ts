import { describe, expect, it } from 'vitest';
import { makeInfoHandler } from '../info';
import { HttpRequest } from '@azure/functions';
import { makeFunctionContext } from './mocks';

const request = new HttpRequest({
  url: 'https://function/info',
  method: 'GET',
});
const context = makeFunctionContext();

describe('info', () => {
  it('should return 200 if the application is healthy', async () => {
    const actual = await makeInfoHandler({})(request, context);
    const expected = {
      message: `Pong from ${request.url}`,
    };
    expect(actual.status).toStrictEqual(200);
    expect(await actual.json()).toMatchObject(expected);
  });
});

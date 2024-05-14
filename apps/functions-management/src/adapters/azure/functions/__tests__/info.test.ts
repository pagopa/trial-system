import { describe, expect, it, vi } from 'vitest';
import { makeInfoHandler } from '../info';
import { Database } from '@azure/cosmos';
import { httpHandlerInputMocks, mockUrl } from '../__mocks__/handlerMocks';
import * as E from 'fp-ts/lib/Either';

const mockDatabaseAccount = vi.fn().mockResolvedValue('');
const cosmosDatabaseMock = {
  client: {
    getDatabaseAccount: mockDatabaseAccount,
  },
} as unknown as Database;

describe('Info handler', () => {
  it('should return an error if the Cosmos health check fail', async () => {
    mockDatabaseAccount.mockRejectedValueOnce('db error');
    const result = await makeInfoHandler({
      ...httpHandlerInputMocks,
      db: cosmosDatabaseMock,
    })();
    expect(result).toMatchObject(E.left(new Error('AzureCosmosDB|db error')));
  });

  it('should succeed if the application is healthy', async () => {
    const result = await makeInfoHandler({
      ...httpHandlerInputMocks,
      db: cosmosDatabaseMock,
    })();

    expect(result).toMatchObject(
      E.right({
        statusCode: 200,
        body: { message: `Pong from ${mockUrl}` },
        headers: expect.any(Object),
      }),
    );
  });
});
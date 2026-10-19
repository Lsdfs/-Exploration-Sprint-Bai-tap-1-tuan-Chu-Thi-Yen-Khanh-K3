import { createApp } from '../../server.mjs';

// Own the server in the test process. Avoid Windows child-process teardown
// depending on taskkill, and force mock mode even if a local API key exists.
export default async function globalSetup() {
  const server = createApp({ provider: 'mock' });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4175, '127.0.0.1', resolve);
  });
  return async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  };
}

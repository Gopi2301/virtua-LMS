#!/bin/sh
set -e

echo "==> [VirtuaLMS API] Checking Database connection..."

# Wait for PostgreSQL to be ready using Node.js built-in network socket
node -e "
const net = require('net');
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

try {
  const parsed = new URL(dbUrl);
  const host = parsed.hostname;
  const port = parseInt(parsed.port || '5432', 10);
  let attempts = 0;
  const maxAttempts = 30;

  function checkConnection() {
    attempts++;
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.connect(port, host, () => {
      console.log('==> [VirtuaLMS API] Database is reachable on ' + host + ':' + port);
      socket.destroy();
      process.exit(0);
    });

    socket.on('error', (err) => {
      socket.destroy();
      if (attempts >= maxAttempts) {
        console.error('==> [VirtuaLMS API] Database connection failed after ' + maxAttempts + ' attempts.');
        process.exit(1);
      }
      setTimeout(checkConnection, 1000);
    });

    socket.on('timeout', () => {
      socket.destroy();
      if (attempts >= maxAttempts) {
        console.error('==> [VirtuaLMS API] Database connection timed out after ' + maxAttempts + ' attempts.');
        process.exit(1);
      }
      setTimeout(checkConnection, 1000);
    });
  }

  checkConnection();
} catch (e) {
  console.error('==> [VirtuaLMS API] Invalid DATABASE_URL:', e.message);
  process.exit(1);
}
"

echo "==> [VirtuaLMS API] Synchronizing Prisma database schema..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "==> [VirtuaLMS API] Applying Prisma migrations..."
  npx prisma migrate deploy
else
  echo "==> [VirtuaLMS API] Pushing schema via prisma db push..."
  npx prisma db push --skip-generate
fi

echo "==> [VirtuaLMS API] Starting NestJS API server..."
exec node dist/main.js

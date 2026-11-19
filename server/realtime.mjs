const clients = new Set();

export function addSseClient(res, user) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const client = {
    res,
    userId: Number(user.id),
    role: String(user.role || ''),
  };
  clients.add(client);

  // Send initial connected event
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      userId: client.userId,
      role: client.role,
      connectedAt: new Date().toISOString(),
    })}\n\n`
  );

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      clients.delete(client);
    }
  }, 25000);

  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

export function publishRealtimeEvent({ event, payload = {}, userIds = [], roles = [] }) {
  const targetIds = new Set(userIds.map((id) => Number(id)));
  const targetRoles = new Set(roles.map((r) => String(r)));
  const serialized = `event: ${event}\ndata: ${JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  for (const client of clients) {
    const matchAll = targetIds.size === 0 && targetRoles.size === 0;
    const matchUser = targetIds.has(client.userId);
    const matchRole = targetRoles.has(client.role) || client.role === 'admin';
    if (matchAll || matchUser || matchRole) {
      try {
        client.res.write(serialized);
      } catch {
        clients.delete(client);
      }
    }
  }
}

export function getConnectedClientsCount() {
  return clients.size;
}


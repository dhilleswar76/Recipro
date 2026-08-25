const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Attach Socket.io Server
  const io = new Server(server, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join Session Room
    socket.on('join-room', ({ roomId, userId, userName, role }) => {
      socket.join(roomId);
      socket.data = { roomId, userId, userName, role };

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      rooms.get(roomId).set(socket.id, { userId, userName, role });

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        userId,
        userName,
        role,
      });

      // Send existing participants list to new user
      const existingUsers = Array.from(rooms.get(roomId).entries())
        .filter(([sId]) => sId !== socket.id)
        .map(([sId, u]) => ({ socketId: sId, ...u }));

      socket.emit('room-users', { users: existingUsers });
      console.log(`[Socket.io] User ${userName} (${userId}) joined room ${roomId}`);
    });

    // WebRTC Signaling: Offer, Answer, ICE Candidates
    socket.on('signal', ({ to, signalData }) => {
      io.to(to).emit('signal', {
        from: socket.id,
        fromUser: socket.data,
        signalData,
      });
    });

    // Live In-Room Chat Sync
    socket.on('send-message', ({ roomId, message }) => {
      io.to(roomId).emit('new-message', message);
    });

    // Collaborative Scratchpad Live Sync
    socket.on('scratchpad-update', ({ roomId, content }) => {
      socket.to(roomId).emit('scratchpad-update', { content });
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      const { roomId, userId, userName } = socket.data || {};
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        }
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userId,
          userName,
        });
      }
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port} with Socket.io WebRTC signaling`);
  });
});

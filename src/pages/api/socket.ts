import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import type { Server as NetServer } from 'http';
import type { Socket as NetSocket } from 'net';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    const rooms = new Map<string, Map<string, any>>();

    io.on('connection', (socket) => {
      socket.on('join-room', ({ roomId, userId, userName, role }) => {
        socket.join(roomId);
        socket.data = { roomId, userId, userName, role };

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }
        rooms.get(roomId)!.set(socket.id, { userId, userName, role });

        socket.to(roomId).emit('user-joined', {
          socketId: socket.id,
          userId,
          userName,
          role,
        });

        const existingUsers = Array.from(rooms.get(roomId)!.entries())
          .filter(([sId]) => sId !== socket.id)
          .map(([sId, u]) => ({ socketId: sId, ...u }));

        socket.emit('room-users', { users: existingUsers });
      });

      socket.on('signal', ({ to, signalData }) => {
        io.to(to).emit('signal', {
          from: socket.id,
          fromUser: socket.data,
          signalData,
        });
      });

      socket.on('send-message', ({ roomId, message }) => {
        io.to(roomId).emit('new-message', message);
      });

      socket.on('scratchpad-update', ({ roomId, content }) => {
        socket.to(roomId).emit('scratchpad-update', { content });
      });

      socket.on('disconnect', () => {
        const { roomId, userId, userName } = socket.data || {};
        if (roomId && rooms.has(roomId)) {
          rooms.get(roomId)!.delete(socket.id);
          socket.to(roomId).emit('user-left', {
            socketId: socket.id,
            userId,
            userName,
          });
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}

import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { sequelize } from "./db";
import jwt from 'fastify-jwt';
import { auth } from "./routes/auth";
import { profile } from "./routes/profile";
import { messagesRoutes } from "./routes/messages";
import initModels from './initModels';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { admin } from "./routes/admin";
import fastifySocketIo from 'fastify-socket.io';

const server = Fastify({
    logger: true
});

server.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});

server.register(fastifySocketIo, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

server.register(jwt, { secret: 'SECRETEXAMPLE' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


server.register(fastifyStatic, {
    root: join(__dirname, '../public'),
    prefix: '/images/',
});

server.register(auth);
server.register(profile);
server.register(messagesRoutes);
server.register(admin);

const initDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected with Sequelize');
        initModels();
        console.log('Models initialized and associated');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

const start = async () => {
    await initDatabase();
    try {
        await server.listen({ port: 3000 });
        console.log('Server is running on http://localhost:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();

import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import User from '../models/User';
import bcrypt from 'bcryptjs';

interface AuthRequestBody {
    username: string;
    password: string;
}

export const auth: FastifyPluginAsync = async (server) => {
    server.post<{ Body: AuthRequestBody }>('/register', async (request, reply) => {
        const { username, password } = request.body;

        if (!username || !password) {
            return reply.code(400).send({ error: 'Username and password are required' });
        }

        try {
            const existingUser = await User.findOne({ where: { username } });

            if (existingUser) {
                return reply.code(400).send({ error: 'Username already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({ username, password: hashedPassword });

            reply.code(201).send({ message: 'User registered successfully' });
        } catch (e) {
            console.error(e);
            reply.code(500).send({ error: 'Failed to register user' });
        }
    });

    server.post<{ Body: AuthRequestBody }>('/login', async (request, reply) => {
        const { username, password } = request.body;

        if (!username || !password) {
            return reply.code(400).send({ error: 'Username and password are required' });
        }

        try {
            const user = await User.findOne({ where: { username } });

            if (!user) {
                return reply.code(401).send({ error: 'Invalid username or password' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return reply.code(401).send({ error: 'Invalid username or password' });
            }

            const token = server.jwt.sign({ id: user.id, username: user.username });

            reply.code(200).send({ message: 'Login successful', token });
        } catch (e) {
            console.error(e);
            reply.code(500).send({ error: 'Failed to login' });
        }
    });
};

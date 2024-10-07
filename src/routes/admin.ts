import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/User';

interface AuthRequestBody {
    username: string;
    password?: string;
    newPassword?: string;
}

export const admin: FastifyPluginAsync = async (server) => {


    server.addHook('preHandler', async (request, reply) => {
        const authHeader = request.headers['authorization'];
        const token = authHeader ? authHeader.split(' ')[1] : undefined;
    
        if (!token) {
            reply.status(403).send({ error: 'Token is required' });
            return;
        }

        try {
            await server.jwt.verify(token);
        } catch (err) {
            reply.status(403).send({ error: 'Invalid token' });
        }
    });

    server.post<{Body: AuthRequestBody}>('/users', async (request, reply) => {
        const { username } = request.body;

        if (!username) {
            return reply.code(400).send({ error: 'Username is required' });
        }

        const adminUser = await User.findOne({ where: { username } });

        if (adminUser!.role !== 'admin') {
            return reply.code(403).send({ error: 'Unauthorized' });
        }

        try {
            const users = await User.findAll();

            if (!users) {
                return reply.code(404).send({ error: 'Users not found' });
            }

            reply.send(users);
        } catch (e) {
            reply.code(500).send({ error: 'Failed to fetch user' });
        }
    });
};

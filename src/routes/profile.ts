import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import fastifyMultipart, { MultipartFile } from 'fastify-multipart';

interface AuthRequestBody {
    username: string;
    password?: string;
    newPassword?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const profile: FastifyPluginAsync = async (server) => {

    server.register(fastifyMultipart);

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

    server.post<{Body: AuthRequestBody}>('/user', async (request, reply) => {
        const { username } = request.body;

        if (!username) {
            return reply.code(400).send({ error: 'Username is required' });
        }

        try {
            const user = await User.findOne({ where: { username } });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            reply.send(user);
        } catch (e) {
            reply.code(500).send({ error: 'Failed to fetch user' });
        }
    });

    server.post<{Body: AuthRequestBody}>('/update/password', async (request, reply) => {
        const { username, password, newPassword } = request.body;

        if (!username || !password || !newPassword) {
            return reply.code(400).send({ error: 'Username and passwords are required' });
        }

        try {
            const user = await User.findOne({ where: { username } });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return reply.code(401).send({ error: 'Invalid username or password' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            reply.send({ message: 'Password updated successfully' });
        } catch (e) {
            reply.code(500).send({ error: 'Failed to fetch user' });
        }
    });

    server.post<{Body: AuthRequestBody}>('/update/profile_picture', async (request, reply) => {
        const data: MultipartFile | undefined = await request.file();
        const username = data!.fields.username.value;
        const filename = data?.filename

        if (!username) {
            return reply.code(400).send({ error: 'Username is required' });
        }

        if (!data) {
            return reply.code(400).send({ error: 'File is required' });
        }

        const filePath = join(__dirname, `../../public/${filename}`);
        const writeStream = createWriteStream(filePath);

        const pump = promisify(pipeline);
        await pump(data.file, writeStream);

        try {
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            user.profile_picture = filename!;
            await user.save();

            reply.send({ message: 'Profile picture updated successfully', filename });
        } catch (e) {
            reply.code(500).send({ error: 'Failed to update profile picture' });
        }
})};

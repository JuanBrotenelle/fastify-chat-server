import { FastifyPluginAsync } from 'fastify';
import User from '../models/User';
import Message from '../models/Message';
import Chat from '../models/Chat';
import { Socket } from 'socket.io';
import {dirname, join} from 'path';
import Sequelize, { Transaction, Op } from 'sequelize';
import { fileURLToPath } from 'url';
import fastifyMultipart, { MultipartFile } from 'fastify-multipart';
import fs from 'fs';
import { sequelize } from '../db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const messagesRoutes: FastifyPluginAsync = async (server) => {

    server.register(fastifyMultipart, {
        attachFieldsToBody: true
      });

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

    server.io.on('connection', (socket: Socket) => {
        console.log('A user connected');

        const token = socket.handshake.query.token;

        if (token) {
            try {
                const user = server.jwt.verify(token);
                const userId = user.id;
            
                socket.join(`user_${userId}`);
                console.log(`User joined room: user_${userId}`);
            } catch (err) {
                console.error('Token verification failed:', err);
                socket.disconnect();
            }
        } else {
            console.log('No token provided, disconnecting socket');
            socket.disconnect();
        }


        socket.on('send_message', async ({ chat_id, user_id, message, photo }) => {
            const msg = await Message.create({
                chat_id: chat_id,
                user_id: user_id,
                message: message,
                photo: photo,
                created_at: new Date(),
            });

            console.log(msg.dataValues);

            socket.emit(`receive_message_${chat_id}`, msg.dataValues);
            socket.broadcast.emit(`receive_message_${chat_id}`, msg.dataValues);
        });
      
        socket.on('disconnect', () => {
          console.log('User disconnected');
        });
      });

      server.post('/group-chat', async (request, reply) => {
        const { user_ids } = request.body;
        const userIds = user_ids.map((item: any) => {
          return typeof item === 'object' && item !== null ? item.id : item;
        }).filter(id => !isNaN(id));
        
        const chat_name = userIds.join(',');
      
        if (userIds.length < 2) {
          return reply.status(400).send({ message: 'Групповой чат должен включать как минимум двух пользователей.' });
        }
      
        let transaction: Transaction | null = null;
      
        try {
          transaction = await sequelize.transaction();
      
          const newChat = await Chat.create({
            chat_name,
            is_group: true,
          }, { transaction });
      
          const users = await User.findAll({
            where: { id: userIds },
            transaction,
          });
      
          if (users.length !== userIds.length) {
            await transaction.rollback();
            return reply.status(404).send({ message: 'Некоторые пользователи не найдены.' });
          }
      
          await newChat.addUsers(users, { transaction });
      
          const chatWithUsers = await Chat.findOne({
            where: { id: newChat.id },
            include: [
              { model: User, as: 'users', attributes: ['id', 'username', 'profile_picture'] },
              { model: Message, as: 'messages', attributes: ['id', 'user_id', 'chat_id', 'message', 'created_at'] },
            ],
            transaction,
          });

          const formattedChat = {
            id: chatWithUsers!.id,
            chat_name: chatWithUsers!.chat_name,
            is_group: chatWithUsers!.is_group,
            created_at: chatWithUsers!.created_at,
            messages: chatWithUsers!.messages,
            users: chatWithUsers!.users!.map(user => ({
                id_user: user.id,
                username_user: user.username,
                profile_picture: user.profile_picture
            }))
        };
      
          await transaction.commit();
      
          for (const user_id of userIds) {
            server.io.to(`user_${user_id}`).emit('new_group_chat', { chat: formattedChat });
          }
      
          reply.status(201).send(chatWithUsers);
        } catch (error) {
          if (transaction) await transaction.rollback();
          console.error(error);
          reply.status(500).send({ message: 'Ошибка при создании группового чата.' });
        }
      });

    server.get('/getuserlist/:username', async (request, reply) => {
        const username = request.params.username;
        
        try {
            const users = await User.findAll({
                where: {
                    username: {
                        [Op.like]: `%${username}%`,
                    },
                },
                attributes: ['id', 'username', 'profile_picture'],
            });

            if (!users || users.length === 0) {
                return reply.code(404).send({ error: 'Users not found' });
            }

            reply.send(users);
        } catch (e) {
            reply.code(500).send({ error: 'Failed to fetch users' });
        }
    });

    server.get('/user/:id/chats', async (request, reply) => {
        const userId = request.params.id;
      
        try {
          const chats = await Chat.findAll({
            include: [
                {
                    model: User,
                    as: 'users',
                    attributes: ['id', 'username', 'profile_picture'],
                    through: {
                        attributes: []
                    }
                },
                {
                    model: Message,
                    as: 'messages',
                    attributes: ['user_id', 'message', 'photo', 'created_at', 'id'],
                    order: [['created_at', 'ASC']]
                }
            ],
            where: {
                id: {
                    [Op.in]: Sequelize.literal(`(SELECT chat_id FROM chat_users WHERE user_id = ${userId})`)
                }
            }
          });
      
          const result = chats.map(chat => ({
            is_group: chat.is_group,
            created_at: chat.created_at,
            id: chat.id,
            users: chat.users.map(user => ({
                id_user: user.id,
                username_user: user.username,
                profile_picture: user.profile_picture,
            })),
            messages: chat.messages.map(message => ({
                id: message.id,
                user_id: message.user_id,
                message: message.message,
                photo: message.photo,
                created_at: message.created_at
            })),
        }));
      
          reply.send(result);
        } catch (err) {
          console.error(err);
          reply.status(500).send({ error: 'Something went wrong' });
        }
      });

      server.post('/message/:chatId/:userId/send', async (request, reply) => {
        try {
            const chatId = request.params.chatId;
            const userId = request.params.userId;
            let messageText = request.body.message.value;
            let photoUrl = null;

            const data: MultipartFile | undefined = await request.body.file
                if (data) {
                        const buffer = data._buf;
                        const filePath = join(__dirname, `../../public/${data.filename}`);
                        try {
                            await fs.promises.writeFile(filePath, buffer);
                            photoUrl = data.filename;
                        } catch (error) {
                            console.error("Ошибка при записи файла:", error);
                        }
                    }
    
            const message = {
                chat_id: chatId,
                user_id: userId,
                message: messageText,
                photo: photoUrl,
            };
    
            reply.send(message);
        } catch (error) {
            console.error('Error processing message:', error);
            reply.status(500).send({ error: 'Failed to process message' });
        }
      });
};

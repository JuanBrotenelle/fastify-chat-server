import { sequelize } from './db';
import Chat from './models/Chat';
import User from './models/User';
import Message from './models/Message';
import { DataTypes } from 'sequelize';

const initModels = () => {
    Chat.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            chat_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            is_group: {
                type: DataTypes.TINYINT,
                allowNull: true,
                defaultValue: 0,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'chats',
            timestamps: false,
        }
    );

    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            username: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            profile_picture: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            role: {
                type: DataTypes.ENUM('admin', 'default'),
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'users',
            timestamps: false,
        }
    );

    Message.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            chat_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            photo: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'messages',
            timestamps: false,
        }
    );

    Chat.associate({ Message, User });
    User.associate({ Message, Chat });
    Message.associate({ User, Chat });
};

export default initModels;

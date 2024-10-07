import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class ChatUser extends Model {
    public chat_id!: number;
    public user_id!: number;
}

ChatUser.init(
    {
        chat_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'chat_users',
        timestamps: false,
    }
);

export default ChatUser;

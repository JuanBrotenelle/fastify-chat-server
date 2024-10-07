import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Message extends Model {
    public id!: number;
    public chat_id!: number;
    public user_id!: number;
    public message!: string | null;
    public created_at!: Date;

    public static associate(models: any) {
        Message.belongsTo(models.Chat, { foreignKey: 'chat_id' });
        Message.belongsTo(models.User, { foreignKey: 'user_id' });
    }
}

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
            type: DataTypes.STRING(255),
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

export default Message;

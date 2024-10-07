import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Chat extends Model {
    public id!: number;
    public chat_name!: string | null;
    public is_group!: boolean;
    public created_at!: Date;

    public static associate(models: any) {
        Chat.hasMany(models.Message, { foreignKey: 'chat_id', as: 'messages' });
        Chat.belongsToMany(models.User, {
        through: 'chat_users',
        foreignKey: 'chat_id',
        as: 'users',
    });
    }
}

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
            get() {
                const value = this.getDataValue('is_group');
                return value === 1;
            }
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

export default Chat;

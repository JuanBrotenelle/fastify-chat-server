import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class User extends Model {
    public id!: number;
    public username!: string;
    public password!: string;
    public profile_picture!: string | null;
    public role!: string | null;
    public created_at!: Date;

    public static associate(models: any) {
        User.hasMany(models.Message, { foreignKey: 'user_id' });
        User.belongsToMany(models.Chat, {
            through: 'chat_users',
            foreignKey: 'user_id',
            as: 'chats',
          });
    }
}

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
        role: {
            type: DataTypes.ENUM('admin', 'default'),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: false,
    }
);

export default User;

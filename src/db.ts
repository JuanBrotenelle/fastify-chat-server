import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('chat_app', 'chatuser', 'password', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

export { sequelize };

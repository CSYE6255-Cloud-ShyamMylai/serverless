const Sequelize = require('sequelize');
const config = require('./config.js');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
    host: config.development.host,
    dialect: config.development.dialect,
    // logging : console.log // displaying the logs from sequlize 
    logging: false // disable logging
});

module.exports = sequelize;

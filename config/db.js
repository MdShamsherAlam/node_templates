const Sequelize = require("sequelize");
const { createNamespace } = require("cls-hooked");

const cls = createNamespace("transaction-namespace"); // any string
Sequelize.useCLS(cls);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000, // Default TiDB port
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true,
      decimalNumbers: true,
      ssl: {
        rejectUnauthorized: true, // Ensures the certificate is validated
      },
    },
    timezone: "+05:30",
    define: {
      freezeTableName: true, // Prevent table names from being pluralized
    },
    logging: false,
    pool: {
      max: 1000,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;

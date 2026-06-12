const configuration = {
  // debug: true,
  client: "postgresql",
  connection: {
    database: "database",
    port: 5400,
    user: "user",
    password: "password",
  },
  migrations: {
    directory: "./knex/migrations",
  },
};

export default configuration;

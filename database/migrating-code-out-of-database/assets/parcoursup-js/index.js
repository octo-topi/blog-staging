import { knex } from "./knex.js";

(async () => {
  const rawResult = await knex.raw(
    'SELECT current_database() AS "databaseName"',
  );
  const databaseName = rawResult.rows[0].databaseName;
  console.log("Successfully connected to database : " + databaseName);

  process.exit(0)
})();

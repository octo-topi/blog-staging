const up = (knex) => {
  return knex.schema.createTable("g_par", (table) => {
    table.double("g_pr_cod");
    table.text("g_pr_val");
    table.text("etiquette1");
  });
};

const down = (knex) => {
  return knex.schema.dropTable("g_par");
};

export { down, up };

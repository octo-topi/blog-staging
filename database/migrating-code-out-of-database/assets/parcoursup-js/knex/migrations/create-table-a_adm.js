const up = (knex) => {
  return knex.schema.createTable("a_adm", (table) => {
    table.double("g_cn_cod");
    table.double("g_ti_cod");
    table.double("g_ta_cod");
    table.double("a_ta_cod");
    table.double("a_sv_cod");
    table.double("c_gp_cod");
    table.double("c_gi_cod");
    table.double("i_rh_cod");
    table.text("etiquette1");
  });
};

const down = (knex) => {
  return knex.schema.dropTable("a_adm");
};

export { down, up };

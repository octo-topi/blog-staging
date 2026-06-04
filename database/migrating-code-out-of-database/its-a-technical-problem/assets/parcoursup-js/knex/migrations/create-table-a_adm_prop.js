const up = (knex) => {
  return knex.schema.createTable("a_adm_prop", (table) => {
    table.double("g_cn_cod");
    table.double("g_ta_cod");
    table.double("i_rh_cod");
    table.double("c_gp_cod");
    table.double("g_ti_cod");
    table.double("c_gi_cod");
    table.double("a_am_flg_mbc");
    table.double("nb_jrs");
    table.double("iteration");
    table.integer("a_sv_flg_dem");
    table.integer("a_sv_flg_oui");
    table.text("etiquette1");
  });
};

const down = (knex) => {
  return knex.schema.dropTable("a_adm_prop");
};

export { down, up };

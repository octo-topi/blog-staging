const up = (knex) => {
  return knex.schema.createTable("a_sit_voe", (table) => {
    table.double("a_sv_cod");
    table.double("a_sv_flg_aff");
    table.double("a_sv_flg_att");
    table.double("a_sv_flg_clo");
    table.double("a_sv_flg_oui");
    table.text("etiquette1");
  });
};

const down = (knex) => {
  return knex.schema.dropTable("a_sit_voe");
};

export { down, up };

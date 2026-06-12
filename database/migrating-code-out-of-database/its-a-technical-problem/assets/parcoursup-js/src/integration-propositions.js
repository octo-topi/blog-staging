import { knex } from "../knex.js";
import { proposition, majFlcAdmCddt } from "./pk-admission-public.js";

(async () => {
  console.log(
    "script d'intégration des propositions d'admission calculées dans les tables de la prod",
  );

  console.log(
    "============================================================================================================",
  );
  console.log("");
  console.log("						INTEGRATION DES PROPOSITIONS");
  console.log("");
  console.log("");
  console.log(
    "============================================================================================================",
  );

  var retour;
  var mess_err;
  var mess_aff;
  var dummy;

  // les en attente sur un voeu
  const query = `SELECT 	a.g_cn_cod,
    a.g_ti_cod, 				a.g_ta_cod,					a.i_rh_cod,
    a.c_gp_cod,				a.c_gi_cod
  FROM a_adm_prop a
  -- Sauf pour les propositions déjà faite ou refusées. SEules les en attentes peuvent être refaites
  WHERE NOT EXISTS (SELECT 1 FROM a_adm ad, a_sit_voe sv
  WHERE g_cn_cod=a.g_cn_cod
  AND   g_ta_cod=a.g_ta_cod
  AND   i_rh_cod=a.i_rh_cod
  AND   ad.a_sv_cod=sv.a_sv_cod
  AND   (a_sv_flg_dem=1 OR a_sv_flg_oui=1))
  AND   nb_jrs=(SELECT CURRENT_DATE + 1 - g_pr_val :: DATE FROM g_par WHERE g_pr_cod=35)`;

  const curs = (await knex.raw(query)).rows;

  for (const c_cddt of curs) {
    // On fait la proposition ...
    retour = proposition(
      c_cddt.g_cn_cod,
      c_cddt.g_ti_cod,
      c_cddt.g_ta_cod,
      c_cddt.i_rh_cod,
      c_cddt.c_gp_cod,
      c_cddt.c_gi_cod,
      1,
      10,
      447240,
      null,
      0,
      0,
      1,
      "10.1.0.99",
      0,
      null,
      mess_err,
      mess_aff,
    );

    if (retour !== 0) {
      continue;
    }

    // Et on recalcule les flags
    retour = majFlcAdmCddt(
      c_cddt.g_cn_cod,
      447240,
      null,
      0,
      0,
      1,
      "10.1.0.99",
      0,
      null,
      mess_err,
      mess_aff,
    );

    if (retour !== 0) {
      continue;
    }

    await knex.raw("COMMIT");
  }
  console.log(
    "============================================================================================================",
  );
  console.log("");
  console.log("						FIN INTEGRATION DES PROPOSITIONS");
  console.log("");
  console.log("");
  console.log(
    "============================================================================================================",
  );

  process.exit(0);
})();

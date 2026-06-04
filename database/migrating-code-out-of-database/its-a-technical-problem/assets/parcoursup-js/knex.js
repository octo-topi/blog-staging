import Knex from "knex";
import configuration from "./knexfile.js";

const knex = Knex(configuration);

export { knex };

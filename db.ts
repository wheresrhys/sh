import { knex } from "knex";

export function getDBConnection() {
  return knex({
    client: "sqlite3",
    connection: {
      filename: "./database/db.sqlite3",
    },
  });
}

import { Knex, knex } from "knex";
import fs from "fs";
import path from "path";

const MIGRATION_DIR = "./migrations";

/**
 * Opens a connection to sqlite database.
 * The path can be read from SQLITE_PATH environment variable
 * or a default of `./db.sqlite3` will be used.
 *
 * If the database **doesn't exist** it will run the scripts in `./migrations` directory.
 *
 * @returns
 */
export async function getDBConnection(): Promise<Knex> {
  const dbPath = process.env["SQLITE_PATH"] || "./db.sqlite3";

  const shouldRunMigrations = !fs.existsSync(dbPath);

  const knexDb = knex({
    client: "sqlite3",
    connection: {
      filename: dbPath,
    },
  });

  if (shouldRunMigrations) {
    console.log("Created new database - running migrations.");
    const migrationFiles = fs.readdirSync(MIGRATION_DIR).sort();
    try {
      for (const migrationFile of migrationFiles) {
        console.log(`Running ${migrationFile}`);
        const migrationSql = fs.readFileSync(
          path.join(MIGRATION_DIR, migrationFile),
          { encoding: "utf8" },
        );
        await knexDb.raw(migrationSql);
      }
    } catch (err) {
      console.error("Failed to run transaction, removing the database file.");
      fs.rmSync(dbPath);
      throw err;
    }
  }
  return knexDb;
}

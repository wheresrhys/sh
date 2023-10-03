import Papa from "papaparse";
import fs from "fs";
import { DateTime } from "luxon";
import { getDBConnection } from "./db";
import { parseAmount } from "./scraperUtils";

/**
 * This script loads a csv file containg spending data in gov.uk/HMRC format
 * into the `spend_transactions` table in a SQLite database.
 *
 * Some basic validation is performed.
 */

// Common data format of _some_ of the spend files.
// Might have to support other formats in the future but this is ok for HMRC & DfT
type GovUKData = {
  "Department family": string;
  Entity: string;
  Date: string;
  "Expense type": string;
  "Expense area": string;
  Supplier: string;
  "Transaction number": string;
  Amount: string;
  Description: string;
  "Supplier Postcode": string;
};

// Corresponds to the spend_transactions table in the database
type SpendTransaction = {
  buyer_name: string;
  supplier_name: string;
  amount: number;
  transaction_timestamp: string; // should be iso format
};

async function main() {
  // TODO: Pass this as an argument?
  const csvPath = "./sample_data/Transparency_DfE_Spend_July_2023__1_.csv";

  console.log(`Reading ${csvPath}.`);
  const csvContent = fs.readFileSync(csvPath, { encoding: "utf8" });
  const csvData = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true, // some files have empty newlines at the end
  });

  console.log(`Read ${csvData.data.length} transactions.`);
  console.debug(`First row: ${JSON.stringify(csvData.data[0])}`);

  const knexDb = await getDBConnection();

  let rowNum = 1;
  for (const row of csvData.data) {
    try {
      // Add more validation in the future?
      const spendDataRow = row as GovUKData;

      // Some files have hundreds of rows with no data at the end, just commas.
      // It's safe to skip these.
      if (spendDataRow.Entity === "") {
        continue;
      }

      // TODO: We might have to support other date formats in the future
      // See https://moment.github.io/luxon/#/parsing
      const isoTsp = DateTime.fromFormat(
        spendDataRow["Date"],
        "dd-MM-yyyy"
      ).toISO();
      if (!isoTsp) {
        throw new Error(
          `Invalid transaction timestamp ${spendDataRow["Date"]}.`
        );
      }

      /**
       * Note that we're not specifying `id` here which will be automatically generated,
       * but knex complains about sqlite not supporting default values.
       * It's ok to ignore that warning.
       */
      // TODO: Use .batchInsert to speed this up, it's really slow with > 1000 transactions!
      await knexDb<SpendTransaction>("spend_transactions").insert({
        buyer_name: spendDataRow["Entity"],
        supplier_name: spendDataRow["Supplier"],
        amount: parseAmount(spendDataRow["Amount"]),
        transaction_timestamp: isoTsp,
      });

      ++rowNum;
    } catch (e) {
      // Re-throw all errors, but log some useful info
      console.error(`Failed to process row ${rowNum}: ${JSON.stringify(row)}`);
      throw e;
    }
  }

  console.log("Finished writing to the DB.");
  await knexDb.destroy();
}

main();

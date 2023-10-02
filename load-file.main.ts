import Papa from "papaparse";
import fs from "fs";
import { DateTime } from "luxon";
import { getDBConnection } from "./db";

type HMRCData = {
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

interface SpendTransaction {
  buyer_name: string;
  supplier_name: string;
  value: number;
  transaction_timestamp: string;
}

async function main() {
  const csvPath = "./sample_data/HMRC_spending_over_25000_for_August_2023.csv";
  console.log(`Reading ${csvPath}.`);
  const csvContent = fs.readFileSync(csvPath, { encoding: "utf-8" });
  const csvData = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  console.log(`Read ${csvData.data.length} transactions.`);
  console.log(`First row: ${JSON.stringify(csvData.data[0])}`);

  const knexDb = getDBConnection();

  const dbSpendTransactions = csvData.data.map<SpendTransaction>((row, i) => {
    const spendDataRow = row as HMRCData;
    const isoTsp = DateTime.fromFormat(
      spendDataRow["Date"],
      "dd/MM/yyyy"
    ).toISO();
    if (!isoTsp) {
      throw new Error(
        `Invalid transaction timestamp ${spendDataRow["Date"]} on row ${i}`
      );
    }

    /**
     * Note that we're not specifying `id` here which will be automatically generated,
     * but knex complains about sqlite not supporting default values.
     * It's ok to ignore that warning
     */
    return {
      buyer_name: spendDataRow["Entity"],
      supplier_name: spendDataRow["Supplier"],
      value: Number.parseFloat(spendDataRow["Amount"]),
      transaction_timestamp: isoTsp,
    };
  });

  await knexDb.batchInsert<SpendTransaction>(
    "spend_transactions",
    dbSpendTransactions,
    100
  );
  console.log("Finished writing to the DB.");
  await knexDb.destroy();
}

main();

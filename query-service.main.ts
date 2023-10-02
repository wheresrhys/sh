import express from "express";
import { getDBConnection } from "./db";

/**
 * This file has little structure and doesn't represent production quality code.
 * Feel free to refactor it or add comments on what could be improved.
 *
 * We specifically avoided any use of sequelize ORM features for simplicity and used plain SQL queries.
 * Sequelize's data mapping is used to get nice JavaScript objects from the database rows.
 *
 * You can switch to using the ORM features or continue using SQL.
 */

const app = express();

app.set("port", process.env.PORT || 3000);

app.use(express.json());

/**
 * This endpoint implements basic way to paginate through the search results.
 * It returns a `endOfResults` flag which is true when there are no more records to fetch.
 */
app.get("/api/stats", async (_req, res) => {
  const knexDb = getDBConnection();

  const uniqueCounts = await knexDb
    .countDistinct({
      unique_buyers: "buyer_name",
      unique_suppliers: "supplier_name",
    })
    .from("spend_transactions");

  const totalCount = await knexDb("spend_transactions").count({ count: "*" });

  res.json({
    unique_buyers: uniqueCounts[0].unique_buyers,
    unique_suppliers: uniqueCounts[0].unique_suppliers,
    transaction_count: totalCount[0].count,
  });
});

app.listen(app.get("port"), () => {
  console.log("  App is running at http://localhost:%d", app.get("port"));
  console.log("  Press CTRL-C to stop\n");
});

import express, { NextFunction, Request, Response } from "express";
import { getDBConnection } from "./lib/db";
import knex from "knex";
import moment from "moment";

/**
 * This file has little structure and doesn't represent production quality code.
 * Feel free to refactor it or add comments on what could be improved.
 *
 * Feel free to use knex's query builder or just plain sql using `knexDb.raw()`.
 *
 */

function isValidDateTime(input: string) {
  return moment(input, moment.ISO_8601, true).isValid();
}

const app = express();

app.set("port", process.env.PORT || 3000);

app.use(express.json());

type SpendStatsResponse = {
  unique_buyers: number;
  transaction_count: number;
  unique_suppliers: number;
};

app.get("/", (_req, res) => {
  // route documentation here
  res.send(`
    <h1>API Routes</h1>
    <p>GET <a href="/api/stats">/api/stats</a> - This operation exposes basic high level stats of the transaction database.</p>
    <p>POST /api/supplier_stats - This operation returns stats for a specific supplier.</p>
    <p>POST /api/top_suppliers - This operation returns the top suppliers by transaction value.</p>
  `);
});

// To productionise I woudl split this into a /controllers directory

/**
 * This operation exposes basic high level stats of the transaction database.
 */
app.get("/api/stats", async (_req, res) => {
  const knexDb = await getDBConnection();

  const result = await knexDb("spend_transactions").select(
    knexDb.raw("COUNT(*) AS transaction_count"),
    knexDb.raw("COUNT(DISTINCT supplier_name) as unique_suppliers"),
    knexDb.raw("COUNT(DISTINCT buyer_name) as unique_buyers"),
  );

  const response: SpendStatsResponse = {
    unique_buyers: result[0].unique_buyers,
    unique_suppliers: result[0].unique_suppliers,
    transaction_count: result[0].transaction_count,
  };

  res.json(response);
});

type SupplierStatsRequest = {
  supplier_name: string;
};

type SupplierStatsResponse = {
  unique_buyers: number;
  transaction_count: number;
  total_transaction_value: number;
};

/**
 * This operation returns stats for a specific supplier.
 */
app.post("/api/supplier_stats", async (req, res, next) => {
  try {
    const knexDb = await getDBConnection();
    const requestPayload = req.body as SupplierStatsRequest;
    if (!requestPayload.supplier_name) {
      throw new Error("`supplier_name` must be specified.");
    }

    const result = await knexDb("spend_transactions")
      .where({ supplier_name: requestPayload.supplier_name })
      .select(
        knexDb.raw("COUNT(*) AS transaction_count"),
        knexDb.raw("SUM(amount) as total_value"),
        knexDb.raw("COUNT(DISTINCT buyer_name) as unique_buyers"),
      );

    console.log(JSON.stringify(result));
    const response: SupplierStatsResponse = {
      unique_buyers: result[0].unique_buyers,
      total_transaction_value: result[0].total_value,
      transaction_count: result[0].transaction_count,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

type TopSuppliersRequest = {
  buyer_name: string;
  // would be good to use the ISO check as a type guard and have a new type
  // ISO that extends string
  from_date: string;
  to_date: string;
};

type TopSuppliersResponse = {
  top_suppliers: {
    name: string;
    total_amount: number;
  }[];
};

app.post("/api/top_suppliers", async (req, res, next) => {
  try {
    const knexDb = await getDBConnection();
    const requestPayload = req.body as TopSuppliersRequest;
    if (!requestPayload.buyer_name) {
      throw new Error("`buyer_name` must be specified.");
    }

    if (
      !requestPayload.from_date ||
      !isValidDateTime(requestPayload.from_date)
    ) {
      throw new Error(
        "`from_date` must be specified using a valid ISO string.",
      );
    }

    if (!requestPayload.to_date || !isValidDateTime(requestPayload.from_date)) {
      throw new Error(
        "`from_date` must be specified using a valid ISO string.",
      );
    }

    const result = await knexDb("spend_transactions")
      .where({ buyer_name: requestPayload.buyer_name })
      .select(
        knexDb.raw("supplier_name as name"),
        knexDb.raw("SUM(amount) as total_value"),
      )
      .groupBy("supplier_name")
      .orderBy("total_value", "desc");

    // this avoids ugly repeating 99999's as a result of some calculations
    result.forEach((result) => {
      result.total_value = Math.round(100 * result.total_value) / 100;
    });
    res.json({
      top_suppliers: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Simple error handling
 */
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: err instanceof Error ? err.message : "Unknown error occured",
  });
});

app.listen(app.get("port"), () => {
  console.log("  App is running at http://localhost:%d", app.get("port"));
  console.log("  Press CTRL-C to stop\n");
});

CREATE TABLE spend_transactions (
  id INTEGER PRIMARY KEY,
  buyer_name TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  value REAL NOT NULL,
  transaction_timestamp TEXT NOT NULL -- iso8601 format
) STRICT;



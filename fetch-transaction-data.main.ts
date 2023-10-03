async function main() {
  const response = await fetch(
    "https://www.gov.uk/api/content/government/collections/spending-over-25-000"
    // "https://www.gov.uk/api/content/government/collections/dfe-department-and-executive-agency-spend-over-25-000"
  );
  const data = await response.json();
  console.log(data);
  // TODO: Implement scraping spend data from gov.uk websites

  throw new Error("Not implemented");
}

main();

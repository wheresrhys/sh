async function main() {
  const response = await fetch(
    "https://www.gov.uk/api/content/government/collections/spending-over-25-000"
  );
  const data = await response.json();
  // TODO: Implement scraping spend data from gov.uk websites
}

main();

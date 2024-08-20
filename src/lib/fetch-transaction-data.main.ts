import { saveCSVToDb } from './load-file'
// Assumption: It's better to log an error and continue with as much good data as we can
// than to fail for everything if a single request fails
// Implication: I'm just logging errors and returning null in general, avoiding 
// implementing any more complex flows
// TODO define proper typings for all these gov data structures
// TODO might be worth abstracting some of this and the next function into a utility that
// takes a url and something like an xpath to recursively fetch data
async function fetchDocuments (collectionUrl) {
  const collectionResponse = await fetch(
    collectionUrl
  );
  const collectionData = await collectionResponse.json();
  const documentPromises = collectionData.links.documents.slice(0, 1).map(async ({ api_url }) => {
    try {
      const documentResponse = await fetch(api_url);
      if (documentResponse.ok) {
        return documentResponse.json();
      } else {
        throw new Error(documentResponse.statusText)
      }
    } catch (err) {
      console.error('Failed to load a document', err);
      return null
    }
  })
  return Promise.all(documentPromises)
}

async function ingestTransactions(document) {
  const attachments = document.details.attachments.filter(({url}) => url.endsWith('csv')).map(({url}) => url);
  return attachments.map(async url => {
    try {
      const csvResponse = await fetch(url);
      if (csvResponse.ok) {
        const csv = csvResponse.text();
        return saveCSVToDb(csv)
      } else {
        throw new Error(csvResponse.statusText)
      }
    } catch (err) {
      console.error('Failed to load a document', err);
      return null
    }
  })
}

// const response = await fetch(
//   "https://www.gov.uk/api/content/government/collections/spending-over-25-000"
//   // "https://www.gov.uk/api/content/government/collections/dfe-department-and-executive-agency-spend-over-25-000"
// );

async function main() {
  // Note: splitting into a 2 stage process sacrifices some parallelisation in favour
  // of comprehensibility. Doubtless it's possible to do get the best of both worlds
  // but erring on the side of comprehensibility for now
  const documents = await fetchDocuments("https://www.gov.uk/api/content/government/collections/spending-over-25-000");
  // Having said that, I'm processing each CSV file (fetch + write to DB) in its entirety in one step
  // to avoid fetching all the CSV files and then pummelling the DB by writing them all at once.
  // Combining fetch and write flattens the spike a bit. In prod I would probably use something like https://www.npmjs.com/package/p-ratelimit
  // to flatten it further.
  documents.map(ingestTransactions);

  const csvFiles = ingestTransactions(documents) = await collectionData.links.documents.slice(0,1).map(async ({api_url}) => {
    const request = await fetch(api_url);
    if (request.ok) {
      const documentData = await request.json();
    }
  });



  // TODO: Implement scraping spend data from gov.uk websites

  throw new Error("Not implemented");
}

main();

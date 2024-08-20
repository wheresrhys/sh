import { pRateLimit }  from 'p-ratelimit';

const limit = pRateLimit({
  interval: 1000,             
  rate: 1, // Set to 1 as I kept getting SQLITE_BUSY errors. Woudl tune it properly for prod
});

// TODO define proper typings for all these gov data structures
type GovUkDocument = {
  details: {
    attachments: {
      url: string
    }[]
  }
}

type GovUkCollection = {
  links: {
    documents: {
      api_url: string
    }[]
  }
}

import { saveCSVToDb } from './load-file.main'
// Assumption: It's better to log an error and continue with as much good data as we can
// than to fail for everything if a single request fails
// Implication: I'm just logging errors and returning null in general, avoiding 
// implementing any more complex flows
// TODO might be worth abstracting some of this and the next function into a utility that
// takes a url and something like an xpath to recursively fetch data
async function fetchDocuments (collectionUrl: string) {
  const collectionResponse = await fetch(
    collectionUrl
  );
  const collectionData: GovUkCollection = await collectionResponse.json();
  console.log('successfully fetched collection', collectionUrl)
  const documentPromises = collectionData.links.documents.map(async ({ api_url }) => {
    try {
      const documentResponse = await fetch(api_url);
      if (documentResponse.ok) {
        const document = await documentResponse.json();
        console.log('successfully fetched document', api_url)
        if (new Date(document.first_published_at) < new Date('2020-01-01')) {
          console.log('discarding document published before 2020', api_url)
          return null;
        };
        return document
      } else {
        throw new Error(documentResponse.statusText)
      }
    } catch (err) {
      console.error('Failed to fetch document', api_url, err);
      return null
    }
  })
  const documents = await Promise.all(documentPromises);
  return documents.filter(doc => Boolean(doc))
}



async function ingestTransactions(document: GovUkDocument) {
  const attachments = document.details.attachments.filter(({url}) => url.endsWith('csv')).map(({url}) => url);
  return attachments.map(async url => {
    try {
      const csvResponse = await fetch(url);
      if (csvResponse.ok) {
        const csv = await csvResponse.text();
        console.log('successfully fetched csv', url)
        await limit(() => saveCSVToDb(csv))
        console.log('successfully saved csv', url)
      } else {
        throw new Error(csvResponse.statusText)
      }
    } catch (err) {
      console.error('Failed to fetch csv', url, err);
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

  return documents.map(ingestTransactions);
  console.log("done ingesting");
}

main();

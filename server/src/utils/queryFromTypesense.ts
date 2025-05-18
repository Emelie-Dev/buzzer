import {
  SearchParams,
  SearchParamsWithPreset,
} from 'typesense/lib/Typesense/Documents.js';
import typesenseClient from '../typesense/client.js';

export default async (
  collection: string,
  queryObj: SearchParams | SearchParamsWithPreset,
  output: string[]
) => {
  const searchResults = await typesenseClient
    .collections(collection)
    .documents()
    .search(queryObj);

  if (searchResults.found > 0) {
    const result = searchResults.hits?.map(({ document }: any) => {
      const obj: any = {};
      output.forEach((field) => (obj[field] = document[field]));
      obj.id = document.id;
      return obj;
    });

    return result;
  } else return [];
};

import { Document, Model, Types } from 'mongoose';
import typesense from './client.js';
import schemas from './schemas.js';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections.js';
import Search from '../models/searchModel.js';
import User from '../models/userModel.js';
import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';

export const transformDocument = (doc: any) => {
  const document = doc instanceof Document ? doc.toObject() : doc;

  for (const [key, value] of Object.entries(document)) {
    if (value instanceof Types.ObjectId) document[key] = String(value);
    else if (value instanceof Date) document[key] = new Date(value).getTime();
    else if (value instanceof Boolean) document[key] = Number(value);
    else if (value instanceof Array)
      document[key] = JSON.stringify(document[key]);
    else if (value instanceof Object) {
      document[key] = transformDocument(value);

      for (const [key2, value2] of Object.entries(value)) {
        document[`${key}.${key2}`] = value2;
      }

      delete document[key];
    }

    if (key === '_id') {
      document.id = String(value);
      delete document[key];
    }
  }

  return document;
};

// Create all schemas if not already present
export async function createSchemasIfNeeded() {
  const existing = await typesense.collections().retrieve();
  const existingNames = existing.map((collection) => collection.name);

  for (const schema of schemas) {
    if (!existingNames.includes(schema.name)) {
      await typesense.collections().create(schema as CollectionCreateSchema);
    }
  }
}

// Sync all documents from MongoDB to Typesense
export async function syncAllCollections() {
  const collections: { model: Model<any>; schemaName: string }[] = [
    { model: Search, schemaName: 'searches' },
    { model: User, schemaName: 'users' },
    { model: Content, schemaName: 'contents' },
    { model: Reel, schemaName: 'reels' },
  ];

  for (const { model, schemaName } of collections) {
    const docs =
      schemaName === 'users'
        ? await model.find({ active: true, emailVerified: true })
        : await model.find();
    const typesenseDocs = docs.map((doc: any) => transformDocument(doc));

    console.log(await model.find(), schemaName);

    await typesense
      .collections(schemaName)
      .documents()
      .import(typesenseDocs, { action: 'upsert' });
  }
}

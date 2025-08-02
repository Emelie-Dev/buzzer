import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import Search from '../models/searchModel.js';
import User from '../models/userModel.js';
import typesense from './client.js';
import schemas from './schemas.js';
import { transformDocument } from './sync.js';

export default () => {
  schemas.forEach(({ name }) => {
    const model =
      name === 'searches'
        ? Search
        : name === 'users'
        ? User
        : name === 'contents'
        ? Content
        : name === 'reels'
        ? Reel
        : null;

    const changeStream = model!.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', async (change) => {
      const doc = change.fullDocument;

      switch (change.operationType) {
        case 'insert':
        case 'update':
        case 'replace': {
          if (!doc) return;
          else if (name === 'users')
            if (!(doc.active && doc.emailVerified)) return;
          const transformed = transformDocument(doc);
          await typesense.collections(name).documents().upsert(transformed);
          break;
        }

        case 'delete': {
          const id = change.documentKey._id.toString();
          await typesense.collections(name).documents(id).delete();
          break;
        }
      }
    });
  });
};

import mongoose, { Schema, Document, Types } from 'mongoose';

interface ISearch extends Document {
  user: Types.ObjectId;
  query: String;
  location: {
    continent: String;
    country: String;
    state: String;
    city: String;
  };
  searchedAt: Date;
  searchCount: Number;
}

const SearchSchema = new Schema<ISearch>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  location: {
    type: {
      continent: String,
      country: String,
      state: String,
      city: String,
    },
    required: true,
  },
  searchCount: {
    type: Number,
    default: 1,
  },
  searchedAt: {
    type: Date,
    default: Date.now,
  },
});

// Deletes search after 7 days.
SearchSchema.index({ searchedAt: 1 }, { expireAfterSeconds: 2592000 });

const Search = mongoose.model<ISearch>('Search', SearchSchema);

export default Search;

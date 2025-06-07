import { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  continent: String;
  country: String;
  state: String;
  city: String;
}

export default new Schema<ILocation>({
  continent: String,
  country: String,
  state: String,
  city: String,
});

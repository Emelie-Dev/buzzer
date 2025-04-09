import { Document } from 'mongoose';

export default (document: Document, fields: string[]) => {
  const protectedData = Object.fromEntries(
    Object.entries(document.toObject()).filter(([key]) => !fields.includes(key))
  );
  return protectedData;
};

import { Document } from 'mongoose';

export default (document: Document, type: string, fields: string[] = []) => {
  if (type === 'user') {
    if (fields.length === 0) {
      fields = [
        'password',
        'emailVerified',
        '__v',
        'active',
        'passwordChangedAt',
      ];
    }
  }

  const protectedData = Object.fromEntries(
    Object.entries(document.toObject()).filter(([key]) => !fields.includes(key))
  );
  return protectedData;
};

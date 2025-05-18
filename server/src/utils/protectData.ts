import { Document } from 'mongoose';

export default (
  document: Document,
  type: string,
  fields: string[] = [],
  plain: boolean = false
) => {
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

  const data = plain ? document : document.toObject();

  const protectedData = Object.fromEntries(
    Object.entries(data).filter(([key]) => !fields.includes(key))
  );
  return protectedData;
};

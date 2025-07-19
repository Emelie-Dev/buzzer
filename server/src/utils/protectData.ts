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
        'settings.security',
      ];
    }
  }

  const data = plain ? document : document.toObject();

  const protectedData = { ...data };
  fields.forEach((field) => {
    const keys = field.split('.');

    let data = protectedData;
    let i = 0;

    while (i < keys.length - 1) {
      if (data[keys[i]] == null) return;
      data = data[keys[i]];
      i++;
    }

    delete data[keys[keys.length - 1]];
  });

  return protectedData;
};

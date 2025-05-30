export default [
  {
    name: 'searches',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'query', type: 'string' },
      // { name: 'searchedAt', type: 'int64' }, // Store as timestamp
      { name: 'searchCount', type: 'int32' },
    ],
    default_sorting_field: 'searchCount',
  },
  {
    name: 'users',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'username', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'createdAt', type: 'int64' },
    ],
  },
  {
    name: 'contents',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'user', type: 'string' },
      { name: 'description', type: 'string' },
      {
        name: 'media',
        type: 'string',
      },
      { name: 'createdAt', type: 'int64' },
    ],
  },
];

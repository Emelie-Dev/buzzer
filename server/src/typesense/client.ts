import Typesense from 'typesense';

const typesenseDev = new Typesense.Client({
  nodes: [
    {
      host: 'typesense', // <-- matches docker service name
      port: 8108,
      protocol: 'http',
    },
  ],
  apiKey: 'xyz',
  connectionTimeoutSeconds: 10,
});

const typesenseProd = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_PROD_HOST!,
      port: 443,
      protocol: 'https',
    },
  ],
  apiKey: process.env.TYPESENSE_PROD_KEY!,
  connectionTimeoutSeconds: 10,
});

export default process.env.NODE_ENV === 'production'
  ? typesenseProd
  : typesenseDev;

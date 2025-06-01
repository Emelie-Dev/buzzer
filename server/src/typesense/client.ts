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
  connectionTimeoutSeconds: 2,
});

const typesenseProd = new Typesense.Client({
  nodes: [
    {
      host: 'r8k3i62abdcspxu4p-1.a1.typesense.net',
      port: 443,
      protocol: 'https',
    },
  ],
  apiKey: process.env.TYPESENSE_PROD_KEY!,
  connectionTimeoutSeconds: 2,
});

export default process.env.NODE_ENV === 'production'
  ? typesenseProd
  : typesenseDev;

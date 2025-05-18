import Typesense from 'typesense';

const typesense = new Typesense.Client({
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

export default typesense;

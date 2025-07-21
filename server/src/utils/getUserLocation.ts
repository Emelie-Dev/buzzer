import axios from 'axios';
// import countryLookup from 'country-code-lookup';

export default async (ip: String = '') => {
  const ips = [
    '202.249.184.43',
    '176.117.24.222',
    '197.210.78.165',
    '175.97.127.132',
    '34.245.69.138',
    '195.234.32.53',
    '122.0.197.174',
    '2.219.184.74',
    '122.6.231.48',
    '13.14.183.84',
  ];

  const { data: location } =
    process.env.NODE_ENV === 'production'
      ? await axios.get(`https://ipwho.is/${ip}`)
      : await axios.get(
          `https://ipwho.is/${ips[Math.floor(Math.random() * 10)]}`
        );

  // const locationDetails = countryLookup.byIso(location.country);

  return {
    continent: location.continent,
    country: location.country,
    state: location.region,
    city: location.city,
  };
};

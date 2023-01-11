import config from '../config';

const fetchDatagrids = async () => {
    const result = await fetch(`${config.apiUrl}list`, { cache: 'no-store' });
    const json = await result.json();
    return json;
};

export default fetchDatagrids;

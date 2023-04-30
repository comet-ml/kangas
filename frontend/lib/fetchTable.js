// Config
import config from '@kangas/config';

// Utils
import fetchData from './fetchData';

const fetchTable = async (query) => {
    const data = await fetchData({ url: `${config.apiUrl}query`, query });
    // Can eventually implement transformations
    return data;
};

export default fetchTable;

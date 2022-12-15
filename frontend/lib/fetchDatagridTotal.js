// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchDatagridTotal = async (query) => {
    const data = await fetchData({ url: `${config.apiUrl}query-total`, query });
    return data; // {"total": int}
};

export default fetchDatagridTotal;

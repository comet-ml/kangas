// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchDatagridTotal = async (query) => {
    if (query?.dgid) {
	const data = await fetchData({ url: `${config.apiUrl}query-total`,
				       query });
	return data; // {"total": int}
    }
    return {"total": 0};
};

export default fetchDatagridTotal;

// Config
import config from '@kangas/config';

// Utils
import fetchIt from './fetchIt';

const fetchDatagridTotal = async (query) => {
    if (query?.dgid) {

	const data = await fetchIt({ url: `${config.apiUrl}query-total`, query });
	return data; // {"total": int}
    }
    return {"total": 0};
};

export default fetchDatagridTotal;

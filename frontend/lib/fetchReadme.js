// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchReadme = async (query) => {
    if (query?.dgid) {
	const data = await fetchData({ url: `${config.apiUrl}readme`,
				       query: {
					   dgid: query.dgid,
					   url: `${config.rootUrl}`
				       }
				     });
	return data;
    }
    return "";
};

export default fetchReadme;

// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';

const fetchAbout = async (query) => {
    if (!!query?.dgid) {
	const data = await fetchIt({ url: `${config.apiUrl}about`,
				     query: {
					 dgid: query.dgid,
					 url: `${config.rootUrl}`
				     }
				   });
	return data.about;
    }
    return "";
};

export default fetchAbout;

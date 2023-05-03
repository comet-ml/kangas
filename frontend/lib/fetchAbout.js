// Config
import config from '@kangas/config';

// Utils
import fetchIt from './fetchIt';

const fetchAbout = async (query) => {
    if (!!query?.dgid) {
		const data = await fetchIt({
			url: `${config.apiUrl}about`,
			query: {
				dgid: query.dgid,
				url: `${config.rootUrl}`,
				timestamp: query?.timestamp
			}
		});
		return data?.about;
    }

    return "";
};

export default fetchAbout;

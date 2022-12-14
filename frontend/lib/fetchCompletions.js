// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchCompletions = async ( dgid ) => {
    if (dgid) {
	const data = await fetchData({
            url: `${config.apiUrl}completions`,
            query: {dgid},
            method: 'POST',
	});

	return data;
    }
    return {};
};

export default fetchCompletions;

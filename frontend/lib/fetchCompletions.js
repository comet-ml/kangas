// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';

const fetchCompletions = async ( dgid ) => {
    if (!!dgid) {
	const data = await fetchIt(
            {
                url: `${config.apiUrl}completions`,
                query: {dgid},
            });
	return data;
    }
    return {};
};

export default fetchCompletions;

// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';

const fetchCompletions = async ( dgid, timestamp, computedColumns ) => {
    if (!!dgid) {
        const data = await fetchIt({
            url: `${config.apiUrl}completions`,
            query: {dgid, timestamp, computedColumns}
        });
        return data;
    }

    return {};
};

export default fetchCompletions;

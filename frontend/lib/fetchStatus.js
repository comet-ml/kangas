import config from '../config';

import fetchIt from './fetchIt';

const fetchStatus = async () => {
    const result = await fetchIt({url: `${config.apiUrl}status`, query: {}});

    return result;
};

export default fetchStatus;

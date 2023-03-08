import config from '../config';

import fetchIt from './fetchIt';

const fetchDatagrids = async () => {
    const json = await fetchIt({url: `${config.apiUrl}list`, query: {}, cache: false});

    if (!Array.isArray(json)) return [];

    return json;
};

export default fetchDatagrids;

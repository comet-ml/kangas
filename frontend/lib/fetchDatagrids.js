import config from '../config';

import fetchIt from './fetchIt';

const fetchDatagrids = async () => {
    const json = await fetchIt({url: `${config.apiUrl}list`, query: {}, cache: false});
    return json;
};

export default fetchDatagrids;

import config from '@kangas/config';

import fetchIt from './fetchIt';

const fetchStatus = async (ssr=false) => {
    const result = ssr ?
        await fetchIt({url: `${config.apiUrl}status`, query: {}}) :
        await fetch(`${config.rootPath}api/status`)

    return result;
};

export default fetchStatus;

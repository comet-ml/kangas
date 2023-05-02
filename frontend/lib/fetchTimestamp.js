import config from '@kangas/config';
import fetchIt from './fetchIt';

const fetchTimestamp = async (dgid, ssr=true) => {
    const data = ssr ? 
        await fetchIt({ url: `${config.apiUrl}timestamp`, query: {dgid}, cache: false }) :
        await fetchIt({ url: `api/timestamp`, query: {dgid}, cache: false })
    return data.timestamp;
};

export default fetchTimestamp;

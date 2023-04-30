import config from '@kangas/config';
import fetchIt from './fetchIt';

const fetchTimestamp = async (dgid) => {
    const data = await fetchIt({url: `${config.apiUrl}timestamp`, query: {dgid}, cache: false});
    return data.timestamp;

};

export default fetchTimestamp;

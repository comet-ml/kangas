// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchStatus = async () => {
    const result = await fetchData({
        url: `${config.apiUrl}status`,
        method: 'GET',
    });

    return result;
};

export default fetchStatus;

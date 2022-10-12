// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchHistogram = async ({ query }) => {
    const data = await fetchData({
        url: `${config.apiUrl}histogram`,
        query,
        method: 'POST',
    });

    return data;
};

export default fetchHistogram;

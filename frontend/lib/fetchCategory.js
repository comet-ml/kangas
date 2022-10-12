// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchCategory = async ({ query }) => {
    const data = await fetchData({
        url: `${config.apiUrl}category`,
        query,
        method: 'POST',
    });

    return data;
};

export default fetchCategory;

import config from '../config';
import fetchData from './fetchData';

// Stubbed for now
//const fetchAvailableMatrices = () => new Promise((res, rej) => res({ matrices: STUB_MATRICES }));

const fetchAvailableMatrices = async () => {
    const data = await fetchData({
        url: `${config.apiUrl}list`,
        method: 'GET',
        returnType: 'json',
    });

    return data;
};

export default fetchAvailableMatrices;

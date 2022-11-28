import config from '../config';

const fetchAvailableMatrices = async () => {
    const res = await fetch(`${config.apiUrl}list`)
    return res.json();
}

export default fetchAvailableMatrices;

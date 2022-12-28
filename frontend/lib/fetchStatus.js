import config from '../config';

const fetchStatus = async () => {
    const result = await fetch(`${config.apiUrl}status`);

    return result;
};

export default fetchStatus;

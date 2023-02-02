// Config
import config from '../config';

// Utils
import fetchData from './fetchIt';

const fetchAssetGroupMetadata = async ({ query, returnType = 'json' }) => {
    const data = await fetchData({
        url: `${config.apiUrl}asset-group-metadata`,
        query,
        method: 'GET',
        returnType,
    });

    return data;
};

export default fetchAssetGroupMetadata;

// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchAsset = async ({ assetId, dgid }) => {
    const data = await fetchData({
        url: `${config.apiUrl}asset-metadata`,
        query: {
            assetId,
            dgid,
        },
        method: 'POST',
        returnType: 'json',
    });

    return data;
};

export default fetchAsset;

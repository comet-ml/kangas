// Config
import config from '../config';

// Utils
import fetchData from './fetchData';
import fetchIt from './fetchIt';

const fetchAssetMetadata = async ({ assetId, dgid }) => {
    const query = {
        assetId,
        dgid,
    };
    const data = await fetchIt({url: `${config.apiUrl}asset-metadata`, query});
    /*
    const data = await fetchData({
        url: `${config.apiUrl}asset-metadata`,
        query: {
            assetId,
            dgid,
        },
        method: 'POST',
        returnType: 'json',
    });
    */

    return data;
};

export default fetchAssetMetadata;

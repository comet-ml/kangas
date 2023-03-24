// Config
import config from '../config';

// Utils
import fetchData from './fetchData';
import fetchIt from './fetchIt';

const fetchAssetMetadata = async ({ assetId, dgid, timestamp, ssr=true}) => {
    const query = {
        assetId,
        dgid,
        timestamp,
    };
    const data = ssr ?
         await fetchIt({url: `${config.apiUrl}asset-metadata`, query}) :
         await fetch(`${config.apiUrl}asset-metadata?assetId=${assetId}&dgid=${dgid}&timestamp=${timestamp}`)

    return data;
};

export default fetchAssetMetadata;

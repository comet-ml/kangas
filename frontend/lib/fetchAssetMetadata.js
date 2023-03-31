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
          await fetchIt({url: `${config.rootPath}api/assetMetadata`, query});

    return data;
};

export default fetchAssetMetadata;

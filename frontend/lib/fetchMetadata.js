// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';

const fetchMetadata = async (query, ssr=false) => {
    const data = ssr ?
        await fetchIt({ url: `${config.apiUrl}metadata`, query }) :
        await fetchIt({ url: `${config.rootPath}api/metadata`, query });

    return data;
}


export default fetchMetadata;

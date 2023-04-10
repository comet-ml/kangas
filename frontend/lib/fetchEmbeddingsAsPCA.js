// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';

const fetchEmbeddingsAsPCA = async (query, ssr=false) => {
    const data = ssr ?
        await fetchIt({ url: `${config.apiUrl}embeddings-as-pca`, query }) :
        await fetchIt({ url: `${config.rootPath}api/embeddings-as-pca`, query });

    return data;
}

export default fetchEmbeddingsAsPCA;

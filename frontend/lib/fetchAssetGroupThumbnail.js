// Config
import config from '@kangas/config';

// Utils
import fetchData from './fetchData';

const fetchAssetGroupThumbnail = async ({ query }) => {
    const data = await fetchData({
        url: `${config.apiUrl}asset-group-thumbnail`,
        query,
        method: 'POST',
        returnType: 'blob',
    });

    const arrayBuffer = await data.arrayBuffer();
    const dataUrl = Buffer.from(arrayBuffer).toString('base64');
    return dataUrl;
};

export default fetchAssetGroupThumbnail;

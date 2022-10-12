// Config
import config from '../config';

// Utils
import fetchData from './fetchData';

const fetchAsset = async ({
    assetId,
    dgid,
    returnUrl = false,
    returnType = 'blob',
    thumbnail = false,
}) => {
    const data = await fetchData({
        url: `${config.apiUrl}download`,
        query: {
            assetId,
            dgid,
            thumbnail,
        },
        method: 'GET',
        returnType,
    });

    if (returnUrl) {
        const arrayBuffer = await data.arrayBuffer();
        const dataUrl = Buffer.from(arrayBuffer).toString('base64');
        return dataUrl;
    }

    return data;
};

export default fetchAsset;

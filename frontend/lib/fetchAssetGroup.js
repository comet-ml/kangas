// Config
import config from '@kangas/config';

// Utils
import fetchData from './fetchData';
import fetchAsset from './fetchAsset';

const fetchAssetGroup = async ({
    query,
    returnUrl = false,
    returnType = 'json',
    size = 0,
    thumbnail = false,
}) => {
    const data = await fetchData({
        url: `${config.apiUrl}asset-group`,
        query,
        method: 'POST',
        returnType,
    });

    if (returnUrl && data?.values?.length) {
        const { dgid } = query;
        const end = size ? size : data.values.length;
        const assetPromises = Promise.all(
            data.values.slice(0, end).map((assetId) => {
                return fetchAsset({
                    assetId,
                    dgid,
                    returnUrl: true,
                    thumbnail,
                });
            })
        ).then((dataUrls) => dataUrls);

        return assetPromises;
    }

    return data;
};

export default fetchAssetGroup;

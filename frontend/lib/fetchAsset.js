import config from '../config';

const fetchAsset = async ({
    assetId,
    dgid,
    returnUrl = false,
    thumbnail = false,
}) => {
    const data = await fetch(`${config.apiUrl}download?assetId=${assetId}&dgid=${dgid}&thumbnail=${thumbnail}`)

    if (returnUrl) {
        const arrayBuffer = await data.arrayBuffer();
        const dataUrl = Buffer.from(arrayBuffer).toString('base64');
        return dataUrl;
    }

    return data;
};

export default fetchAsset;

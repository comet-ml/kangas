import config from '../config';

const parseEndpoint = ({ thumbnail, group }) => {
    if (group) {
        return thumbnail ? 'asset-group-thumbnail' : 'asset-group'
    } else {
        return 'download'
    }
};
const parseRequestType = (endpoint) => endpoint.includes('asset-group') ? 'POST' : 'GET';
const fetchData = async ({ query, endpoint, requestType }) => {
    console.log(query)
    if (requestType === 'GET') {
        const queryString = new URLSearchParams(query).toString();
        const data = await fetch(`${config.apiUrl}${endpoint}${queryString}`);
        return data;
    } else if (requestType === 'POST') {
        const data = await fetch(`${config.apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query)
        })

        return data;
    }
}
const fetchAsset = async ({
    assetId,
    dgid,
    returnUrl = false,
    thumbnail = false,
    group = false
}) => {
    const endpoint = parseEndpoint({ thumbnail, group });
    const requestType = parseRequestType(endpoint);
    const data = await fetchData({ query: { dgid, assetId, thumbnail }, endpoint, requestType});

    if (returnUrl) {
        const arrayBuffer = await data.arrayBuffer();
        const dataUrl = Buffer.from(arrayBuffer).toString('base64');
        return dataUrl;
    }

    return data;
};

export default fetchAsset;

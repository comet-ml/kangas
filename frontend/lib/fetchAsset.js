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
    if (requestType === 'GET') {
        const queryString = new URLSearchParams(query).toString();
        const data = await fetch(`${config.apiUrl}${endpoint}?${queryString}`);
        console.log(`${config.apiUrl}${endpoint}?${queryString}`)
        return data;
    } else if (requestType === 'POST') {
        const data = await fetch(`${config.apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query)
        })

        if (endpoint === 'asset-group-thumbnail') {
            return data;
        }
        return data;
    }
}

const fetchAsset = async ({
    query,
    returnUrl = false,
    thumbnail = false,
}) => {
    const endpoint = parseEndpoint({ thumbnail, group: !!query?.groupBy });
    const requestType = parseRequestType(endpoint);
    const data = await fetchData({ query, endpoint, requestType});

    if (returnUrl) {
        const arrayBuffer = await data.arrayBuffer();
        const dataUrl = Buffer.from(arrayBuffer).toString('base64');
        return dataUrl;
    }

    return data;
};

export default fetchAsset;

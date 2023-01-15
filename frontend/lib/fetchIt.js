import config from '../config';

// Old way:
// const fetchIt = async (url, query, method='POST', cache=false, json=true, returnUrl=false) => {
// New way:
const fetchIt = async ({url, query, method='GET', cache=config.cache, json=true, returnUrl=false}) => {
    let queryArgs = '';
    const headers = {};
    const request = {
        method,
        headers,
    };

    if (method === 'GET') {
        const newQuery = {
            ...query
        };
        if (returnUrl)
            newQuery.returnUrl = true;

        queryArgs = new URLSearchParams(
            Object.fromEntries(
                Object.entries(newQuery).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();
    } else {
        request.body = JSON.stringify(query);
    }

    if (json) {
        headers['Content-Type'] = 'application/json';
    }

    if (cache) {
        request.next = {
            revalidate: 1440
        }; // 60 * 24 = 1440, 1 day
    } else {
        request.cache = 'no-store';
    }

    console.log(`fetchIt ${method}: ${url}?${queryArgs}, json: ${json}`);
    const res = await fetch(`${url}?${queryArgs}`, request);

    if (json) {
        const data = await res.json();
        if (returnUrl)
            return data.uri;
        return data;
    } else {
        return res;
    }

};

export default fetchIt;

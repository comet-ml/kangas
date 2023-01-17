import config from '../config';

// Old way:
// const fetchIt = async (url, query, method='POST', cache=false, json=true, returnUrl=false) => {
// New way:
const parseQuery = (query) => {
    const url = new URLSearchParams(
        Object.fromEntries(
            Object.entries(query).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
        ))
        .toString();



    return url;
}
/*
const cachedFetch = async ({ url, query={}, method="GET", next = { revalidate: 1440 }, ...args }) => {
    const options = { next, ...args };

    if (!config.cache) {
        delete options?.cache;
        delete options?.next?.revalidate;
    }

    try {

        if (method === 'GET') {
            const res = await fetch(`${url}?${parseQuery(query)}`, { ...options });
            return res;
        } else if (method === 'POST') {
            const body = JSON.stringify(query);
            const res = await fetch(url, { body, ...options });
            return res;
        }

    } catch (error) {
        console.log(error);
        console.log("WE FAILED")
    }
}
*/

// TODO: Remove JSON arg--let components resolve promises however they need
const cachedFetch = async ({url, query = {}, method='GET', cache=config.cache, json=true, returnUrl=false, ...args}) => {
    let queryArgs = '';
    const headers = {};
    const request = {
        method,
        headers,
        ...args
    };

    if (method === 'GET') {
        queryArgs = new URLSearchParams(
            Object.fromEntries(
                Object.entries({ 
                    ...query,
                    returnUrl: returnUrl ? true : undefined
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();

    } else {
        request.body = JSON.stringify(query);
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
        if (returnUrl) return data.uri;
        return data;
    } else {
        return res;
    }

};

export default cachedFetch;

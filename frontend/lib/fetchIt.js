import config from '../config';
import formatQueryArgs from './formatQueryArgs';

const fetchIt = async ({
    url,
    query = {},
    method='GET',
    cache=config.cache,
    json=true,
    returnUrl=false,
    ...args
}) => {
    let queryArgs = '';
    const headers = {};
    const request = {
        method,
        headers,
        ...args
    };

    if (method === 'GET') {
        const args = {
            ...query,
            returnUrl,
        };
        queryArgs = formatQueryArgs(args);
    } else {
        request.body = JSON.stringify(query);
    }

    if (cache) {
        request.next = {
            revalidate: 1440
        }; // 60 * 24 = 1440, 1 day
        request.cache = 'force-cache';
    } else {
        request.cache = 'no-store';
    }

    try {
        const res = await fetch(`${url}?${queryArgs}`, request);

        if (json) {
            const data = await res.json();
            if (returnUrl) return data.uri;

            return data;
        } else {
            return res;
        }
    } catch (error) {
        console.log(`fetch error: ${url}?${queryArgs}`);
        console.log(error);
        return {
            error: true
        };
    }

};

export default fetchIt;

import config from '../config';
import retry from 'fetch-retry';

const wrappedFetch = retry(fetch, {
    retries: 5,
    retryDelay: 0
});

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

    try {
        
        /*const res = await wrappedFetch(`${url}?${queryArgs}`, {
            retryOn: function (attempt, error, response) {
                if (url?.includes('undefined:undefined')) return false;
                console.log('retrying')
                if (attempt > 20) return false;
                console.log(error);
                if (error) return true;
            },
            retryDelay:  2000,
            ...request
        });*/
        

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

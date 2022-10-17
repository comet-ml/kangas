const cache = {
    expiration: null
};
function clearCache() {
    for (const key in cache) {
        delete cache[key];
    }
}

function useData(key, fetcher) {
    if (!cache[key]?.func || cache[key]?.created < cache.expiration) {
        let data;
        let error;
        let promise;
        const created = Date.now();
        cache[key] = {
            func: () => {
                if (error !== undefined || data !== undefined)
                    return { data, error };
                if (!promise) {
                    promise = fetcher()
                        .then((r) => (data = r))
                        // Convert all errors to plain string for serialization
                        .catch((e) => (error = e + ''));
                }
                throw promise;
            },
            created
        }
    }
    return cache[key].func();
}

const updateExpiration = (time) => {
    if (time) cache.expiration = time;
}

export { clearCache, useData, updateExpiration };

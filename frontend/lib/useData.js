const cache = {};

function clearCache() {
    for (const key in cache) {
        delete cache[key];
    }
}

function useData(key, fetcher) {
    if (!cache[key]) {
        let data;
        let error;
        let promise;
        cache[key] = () => {
            if (error !== undefined || data !== undefined)
                return { data, error };
            if (!promise) {
                promise = fetcher()
                    .then((r) => (data = r))
                    // Convert all errors to plain string for serialization
                    .catch((e) => (error = e + ''));
            }
            throw promise;
        };
    }
    return cache[key]();
}

export { clearCache, useData };

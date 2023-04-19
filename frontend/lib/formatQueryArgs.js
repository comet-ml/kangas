const formatQueryArgs = (obj) => {
    return Object.entries(obj)
        .filter(([key, value]) => typeof(value) !== 'undefined' && value !== null)
        .map(([key, value]) => {
            if (value !== null && typeof(value) === 'object') {
                value = JSON.stringify(value)
            }
            return `${key}=${encodeURIComponent(`${value}`)}`
        })
        .join('&');
}

export default formatQueryArgs;

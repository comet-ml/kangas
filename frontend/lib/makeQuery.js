// Replacement for _.set()
// Modified from https://youmightnotneed.com/lodash#set
// NOTE: if path is blank, value must be an object
const set = (obj, path = '', value = {}) => {
    // Handle empty string paths
    const parsed = path.trim();
    if (!parsed.length)
        return {
            ...obj,
            ...value,
        };

    // Regex explained: https://regexr.com/58j0k
    const pathArray = parsed.match(/([^[.\]])+/g);
    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {};
        if (i === pathArray.length - 1) acc[key] = value;
        return acc[key];
    }, obj);

    return obj;
};

const makeQuery = (query, subtree, value) => {
    return set({ ...query }, subtree, value);
};

export default makeQuery;

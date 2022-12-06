// Simple utility function to check if a value is primitive. Useful for grouped cells, as we
// only group on primitive values/need an object like {queryKey: queryArg} to execute a query

const isPrimitive = val => {
    return val !== Object(val);
}

export default isPrimitive;
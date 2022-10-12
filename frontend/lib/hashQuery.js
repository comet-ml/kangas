import { Buffer } from 'node:buffer';

// Simple helper to generate a hash from a query object. We use this because
// our caching system, which is necessary to use React.Suspense, needs to assign a
// unique key to each distinct query.
const hashQuery = (query) => {
    return Buffer.from(JSON.stringify(query)).toString('base64');
};

export default hashQuery;

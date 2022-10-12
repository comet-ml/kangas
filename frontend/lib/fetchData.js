
// Return type can be either json or blob, not case-sensitive
const fetchData = async ({
    url,
    query = {},
    method = 'POST',
    returnType = 'json',
}) => {
    const request = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Attaching a body to a GET request will throw an error
    if (method === 'POST') request['body'] = JSON.stringify(query);

    // For GET requests, we have to parse the query into a url
    let getUrl = null;

    if (method === 'GET') {
        const params = new URLSearchParams(query);
        getUrl = `${url}?${params.toString()}`;
    }

    const res = await fetch(getUrl || url, request);
    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`);
    }

    if (returnType.toLowerCase() === 'json') return res.json();
    if (returnType.toLowerCase() === 'blob') return res.blob();
    if (returnType.toLowerCase() === 'text') return res.text();
    throw `${returnType} is not a valid return type. Please choose either JSON or Blob`;
};

export default fetchData;

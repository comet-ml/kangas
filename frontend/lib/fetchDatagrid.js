import config from '../config';

const fetchDataGrid = async (query, url=config.apiUrl) => {
    // TODO: Rip this conditional return out. This is just here for testing purposes.
    // console.log(headersList);
    if (!query?.dgid) return {
        columnTypes: [], 
        columns: [], 
        rows: [], 
        typeMap: [], 
        displayColumns: []
    }

    const test = new URLSearchParams(
        Object.fromEntries(
            Object.entries(query).filter(([k, v]) => !!v)
        )
    ).toString();

    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        next: {
            revalidate: 10000000000
        },
        body: JSON.stringify(query),
    };

    try {
        const res = await fetch(`${url}query-page?${test}`, request);
        const data = await res.json();

        const { columnTypes, columns, rows } = data;
        const typeMap = Object.fromEntries(
            columns.map((col, idx) => [col, columnTypes[idx]])
        )
        const displayColumns = columns.filter(colName => !colName.endsWith('--metadata'));

        return {
            ...data,
            typeMap,
            displayColumns
        }
    } catch (error) {
        console.log(error);
        console.log("NOOOOOOO")
    }
};

export default fetchDataGrid;

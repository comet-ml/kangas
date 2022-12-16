import config from '../config';

const fetchDataGrid = async (query) => {
    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    };

    const res = await fetch(`${config.apiUrl}query-page`, request);
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
}

export default fetchDataGrid;

import config from '../config';
import cachedFetch from './fetchIt';

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

    try {
        const data = await cachedFetch({url: `${url}query-page`, query});

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

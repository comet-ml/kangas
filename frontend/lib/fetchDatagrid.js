import config from '@kangas/config';
import fetchIt from './fetchIt';

const fetchDataGrid = async (query, url=config.apiUrl) => {
    if (!query?.dgid) return {
        columnTypes: [],
        columns: [],
        rows: [],
        typeMap: [],
        displayColumns: []
    }

    try {
        const data = await fetchIt({url: `${url}query-page`, query});

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
        console.log("fetchDatagrid: server not ready");
	return null;
    }
};

export default fetchDataGrid;

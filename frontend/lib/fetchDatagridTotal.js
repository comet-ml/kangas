// Config
import config from '@kangas/config';

// Utils
import fetchIt from './fetchIt';

const fetchDatagridTotal = async (query) => {
    if (query?.dgid) {
	const myQuery = {
	    dgid: query.dgid,
	    whereExpr: query.whereExpr,
	    groupBy: query.groupBy,
	    computedColumns: query.computedColumns,
	};

	const data = await fetchIt({ url: `${config.apiUrl}query-total`,
				     query: myQuery });
	return data; // {"total": int}
    }
    return {"total": 0};
};

export default fetchDatagridTotal;

// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';

const fetchDatagridTotal = async (query) => {
    if (query?.dgid) {
	const myQuery = {
	    dgid: query.dgid
	};
	if (!!query?.whereExpr)
	    myQuery.whereExpr = query.whereExpr;

	if (!!query?.groupBy)
	    myQuery.groupBy = query.groupBy;

	const data = await fetchIt({ url: `${config.apiUrl}query-total`,
				     query: myQuery });
	return data; // {"total": int}
    }
    return {"total": 0};
};

export default fetchDatagridTotal;

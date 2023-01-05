/* eslint-disable react/jsx-key */

import fetchDataGridTotal from '../../lib/fetchDatagridTotal';
import Pager from './pager';

const PagerBar = async ({query}) => {
    const totalRows = (await fetchDataGridTotal(query)).total;

    const firstRow = query.offset + 1;
    const currentPage = Math.floor(query.offset / query.limit) + 1;
    const totalPages = Math.ceil(totalRows / query.limit);
    const maxRow = Math.min(
	query.offset + query.limit,
	totalRows,
    );
    const pageSize = query.limit;

    return (
	    <Pager
	      firstRow={firstRow}
	      totalRows={totalRows}
              currentPage={currentPage}
	      totalPages={totalPages}
	      maxRow={maxRow}
	      pageSize={pageSize}
	    />
    );
};

export default PagerBar;

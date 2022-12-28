import config from '../config';
import fetchDataGrid from '../lib/fetchDatagrid';
import fetchAvailableMatrices from '../lib/fetchAvailableMatrices';
import Table from './Table/table';
import ButtonBar from './Settings';
import Pager from './Pager/pager';

const Page = async ({ searchParams }) => {
    const {
        datagrid='./notebooks/coco-500.datagrid',
        filter,
        groupBy,
        sortBy,
        sortDesc,
        page,
        rows,
    } = searchParams;

    // Limit and offset are always set; get base or view defaults:
    const limit = rows ? parseInt(rows) : 10;
    const offset = page ? (parseInt(page) - 1) * limit : 0;

    // FIXME: What to do with empty datagrid?

    const query = {
        dgid: datagrid,
        whereExpr: filter,
        groupBy,
        sortBy,
        sortDesc,
        offset,
        limit,
    };

    return (
        <div>
	        <ButtonBar query={query} />
            <Table query={query} />
	        <Pager query={query} />
        </div>
    );
};

export default Page;

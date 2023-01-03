import config from '../config';
import fetchDataGrid from '../lib/fetchDatagrid';
import fetchAvailableMatrices from '../lib/fetchAvailableMatrices';
import Table from './Table/table';
import ButtonBar from './Settings';
import Pager from './Pager/pager';
import ViewProvider from './contexts/ViewContext';
import defaultCellSizes from '../lib/consts/defaultCellSizes';


const Page = async ({ searchParams }) => {
    const {
        dgid,
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
        dgid,
        whereExpr: filter,
        groupBy,
        sortBy,
        sortDesc,
        offset,
        limit,
    };

    const data = await fetchDataGrid(query)
    const { columnTypes, columns } = data;
    const view = Object.fromEntries( columns.map( ( col, idx ) => [ col, defaultCellSizes?.[ columnTypes[idx ] ] ] ) );

    return (
        <div>
            <ViewProvider value={{ columns: view }}>
                <ButtonBar query={query} />
                <Table query={query} />
                <Pager query={query} />
            </ViewProvider>
        </div>
    );
};

export default Page;

import config from '../config';
import fetchDataGrid from '../lib/fetchDatagrid';
import fetchAvailableMatrices from '../lib/fetchAvailableMatrices';
import Table from './Table/table';
import SettingsBar from './Settings';
import PagerBar from './PagerBar';
import ViewProvider from './contexts/ViewContext';
import defaultCellSizes from '../lib/consts/defaultCellSizes';


const Page = async ({ searchParams }) => {
    // User-facing URL param API
    const {
        datagrid,
        filter,
        group,
        sort,
        descending,
        page,
        rows,
        select
    } = searchParams;

    // Limit and offset are always set; get base or view defaults:
    const limit = rows ? parseInt(rows) : 10;
    const offset = page ? (parseInt(page) - 1) * limit : 0;

    // FIXME: What to do with empty datagrid?

    const query = {
        dgid: datagrid,
        whereExpr: filter,
        groupBy: group,
        sortBy: sort,
        sortDesc: descending,
        select: select?.split(','),
        offset,
        limit,
    };

    const data = await fetchDataGrid(query)
    const { columnTypes, columns } = data;
    const view = Object.fromEntries( columns.map( ( col, idx ) => [ col, defaultCellSizes?.[ columnTypes[idx ] ] ] ) );

    return (
        <div>
            <ViewProvider value={{ columns: view }}>
                <SettingsBar query={query} />
                <Table query={query} />
                <PagerBar query={query} />
            </ViewProvider>
        </div>
    );
};

export default Page;

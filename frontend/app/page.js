import config from '../config';
import fetchDataGrid from '../lib/fetchDatagrid';
import fetchAvailableMatrices from '../lib/fetchAvailableMatrices';
import Table, { TableDisplay } from './Table/table';
import SettingsBar from './Settings';
import PagerBar from './PagerBar';
import ViewProvider from './contexts/ViewContext';
import defaultCellSizes from '../lib/consts/defaultCellSizes';
import { Suspense, cache } from 'react';
import fetchDatagrids from '../lib/fetchDatagrids';
import EMPTY from '../lib/consts/emptyTable';
import Prefetch from './prefetch';


const Main = async ({ query }) => {
    const data = await fetchDataGrid(query);
    const { columnTypes, columns } = data;
    const view =  Object.fromEntries( columns.map( ( col, idx ) => [ col, defaultCellSizes?.[ columnTypes[idx ] ] ] ) );

    return (
        <ViewProvider value={{ columns: view }}>
            <SettingsBar query={query} />
            <Suspense fallback={<TableDisplay data={EMPTY} query={query} />}>
                <Table query={query} />
            </Suspense>
            <PagerBar query={query} />
        </ViewProvider>
    )
}

const Loading = ({ query }) => {
    const { columnTypes, columns } = EMPTY;
    const view = Object.fromEntries( columns.map( ( col, idx ) => [ col, defaultCellSizes?.[ columnTypes[idx ] ] ] ) );

    return (
        <ViewProvider value={{ columns: view }}>
            <SettingsBar query={query} />
            <Table query={query} />
            <PagerBar query={query} />
        </ViewProvider>
    )
}

const Page = async ({ searchParams }) => {
    const datagrids = await fetchDatagrids();

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
        sortDesc: descending === 'true',
        select: select?.split(','),
        offset,
        limit,
    };


    return (
        <div>
            <Suspense fallback={<Loading query={query} />}>
                <Main query={query} />
            </Suspense>
            <Suspense fallback={<></>}>
                <Prefetch datagrids={datagrids} query={query} />
            </Suspense>
        </div>
    );
};

export default Page;


import fetchDataGrid from '../lib/fetchDatagrid';
import fetchAvailableMatrices from '../lib/fetchAvailableMatrices';
import Table, { TableDisplay } from './Table/table';
import SettingsBar from './Settings';
import PagerBar from './PagerBar';
import ViewProvider from './contexts/ViewContext';
import getDefaultCellSize from '../lib/getDefaultCellSize';
import { Suspense, cache } from 'react';
import fetchDatagrids from '../lib/fetchDatagrids';
import fetchTimestamp from '../lib/fetchTimestamp';
import EMPTY from '../lib/consts/emptyTable';
import Prefetch from './prefetch';
import Skeleton from './Skeleton';

const Main = async ({ query }) => {
    const data = await fetchDataGrid(query);

    const { columnTypes, columns } = data || EMPTY;
    const viewStart = query?.begin ?? 0;
    const viewEnd = query?.boundary ?? 20;

    const view =  Object.fromEntries( columns.map( ( col, idx ) => [ col, { width: getDefaultCellSize(columnTypes[idx], query?.groupBy) } ]));

    return (
        <ViewProvider value={{ columns: view, query }}>
            <Suspense fallback={<>Loading</>}><SettingsBar query={query} columns={columns} /></Suspense>
            <Suspense fallback={<>Loading</>}><Table data={data} query={query} start={viewStart} end={viewEnd} /></Suspense>
            <Suspense fallback={<>Loading</>}><PagerBar query={query} /></Suspense>
        </ViewProvider>
    );
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
        select,
        boundary,
        begin
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
        boundary,
        begin
    };

    if (!!datagrid) query.timestamp = await fetchTimestamp(datagrid);

    return (
        <div>
            <Suspense fallback={<Skeleton message={"Suspending Page"} />}>
                <Main query={query} />
            </Suspense>
            <Suspense fallback={<></>}>
                <Prefetch datagrids={datagrids} query={query} />
            </Suspense>
        </div>
    );
};

export const fetchCache = 'force-cache';

export default Page;


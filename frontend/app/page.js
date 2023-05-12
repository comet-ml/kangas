import fetchDataGrid from '@kangas/lib/fetchDatagrid';
import fetchAvailableMatrices from '@kangas/lib/fetchAvailableMatrices';
import Table, { TableDisplay } from './Table/table';
import SettingsBar from './Settings';
import PagerBar from './PagerBar';
import ViewProvider from '@kangas/app/contexts/ViewContext';
import getDefaultCellSize from '@kangas/lib/getDefaultCellSize';
import { Suspense, cache } from 'react';
import fetchDatagrids from '@kangas/lib/fetchDatagrids';
import fetchTimestamp from '@kangas/lib/fetchTimestamp';
import EMPTY from '@kangas/lib/consts/emptyTable';
import Prefetch from './prefetch';
import Skeleton from './Skeleton';
import Imports from './perf/Imports';
import Polling from './Polling';

const Main = async ({ query }) => {
    const data = await fetchDataGrid(query);

    const { columnTypes, columns, displayColumns } = data || EMPTY;
    const viewStart = query?.begin ?? 0;
    const viewEnd = query?.boundary ?? 20;

    const view =  Object.fromEntries( columns.map( ( col, idx ) => [ col, { width: getDefaultCellSize(columnTypes[idx], query?.groupBy) } ]).filter(col => displayColumns.includes(col[0])));

    return (
        <ViewProvider value={{ columns: view, query }}>
            <Polling>
                <Suspense fallback={<>Loading</>}><SettingsBar query={query} columns={columns} /></Suspense>
                <Suspense fallback={<>Loading</>}><Table data={data} query={query} start={viewStart} end={viewEnd} /></Suspense>
                <Suspense fallback={<>Loading</>}><PagerBar query={query} /></Suspense>
            </Polling>
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
        begin,
	    cc,
        timestamp
    } = searchParams;

    // Limit and offset are always set; get base or view defaults:
    const limit = rows ? parseInt(rows) : (group ? 4 : 10);
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
        begin,
    };

    if (!!datagrid) {
        query.timestamp = await fetchTimestamp(datagrid);
    } 

    if (!!cc) {
	    query.computedColumns = JSON.parse(cc);
    }

    return (
        <>
            <Imports />
            <Suspense fallback={<Skeleton message={"Suspending Page"} />}>
                <Main query={query} />
            </Suspense>
            <Suspense fallback={<></>}>
                <Prefetch datagrids={datagrids} query={query} />
            </Suspense>
        </>
    );
};

export const fetchCache = 'force-cache';

export default Page;


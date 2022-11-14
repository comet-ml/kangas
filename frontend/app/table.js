/* eslint-disable react/jsx-key */

// React
import { Suspense } from 'react';


// Utils
import config from '../config';
import Skeletons from '../components/skeletons';
import { EMPTY_TABLE } from '../stubs';
import ClientContext from '../components/Cells/ClientContext.client';
// If not imported here, the import in page.client.js will fail
import { StyledEngineProvider } from '@mui/material';

const Root = ({ query, matrices, data}) => {
    /* eslint-disable no-unused-vars */

    /* eslint-enable no-unused-vars */
    const { dgid } = query;
    const { columnTypes, columns, rows, total } = data ?? EMPTY_TABLE;

    const columnOptions = allColumns
        ? allColumns?.columns?.filter((col) => !col.endsWith('--metadata'))
        : [];
    // TODO Clean this up with .filter()
    const filteredColumns = [];
    const filteredColumnTypes = [];
    columns.forEach((columnName, idx) => {
        if (!columnName.endsWith('--metadata')) {
            filteredColumnTypes.push(columnTypes[idx]);
            filteredColumns.push(columnName);
        }
    });

    // TODO Clean up
    const rowClass = !!query?.groupBy && query?.groupBy ? 'row-group' : 'row';
    const colClass =
        !!query?.groupBy && query?.groupBy
            ? 'column-group cell-group'
            : 'column cell';
    const headerClass = colClass.includes('group') ? 'column-group' : 'column';
    return (
        <>
            <Suspense fallback={<Skeletons />}>
                <ClientContext apiUrl={config.apiUrl} otherUrl={config.apiUrl} isColab={config.isColab} >
                    <div className="table-root">
                        <div id="header-row" className={`${rowClass}`}>
                            {filteredColumns.map((col) => (
                                <div className={headerClass} title={col}>
                                    {col}
                                </div>
                            ))}
                        </div>
                        {rows.map((row, ridx) => (
                            <div className={`${rowClass}`} key={`row-${ridx}`}>
                                {ridx}
                            </div>
                        ))}
                    </div>
                </ClientContext>
            </Suspense>
        </>
    );
};

export default Root;


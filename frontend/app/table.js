/* eslint-disable react/jsx-key */

import fetchDataGrid from '../lib/fetchDatagrid';
import Cell from './cells/base';

const Table = async ({ query }) => {
    const data = await fetchDataGrid(query)
    const { columnTypes, columns, rows, total, typeMap, displayColumns } = data;

    const rowClass = !!query?.groupBy ? 'row-group' : 'row';
    const colClass = !!query?.groupBy ? 'column-group cell-group' : 'column cell';
    const headerClass = !!query?.groupBy ? 'column-group' : 'column';
    return (
            <div className="table-root">
                <div style={{ display: 'flex' }} id="header-row" className={`${rowClass}`}>
                    {displayColumns?.map((col) => (
                        <div className={headerClass} title={col}>
                            {col}
                        </div>
                    ))}
                </div>
                {rows?.map((row, ridx) => (
                    <div style={{ display: 'flex' }} className={`${rowClass}`} key={`row-${ridx}`}>
                        {
                            Object.values(row).map( (cell, cidx) => <Cell value={cell} type={columnTypes[cidx]} dgid={query?.dgid} /> )
                        }
                    </div>
                ))}
            </div>
    );
};

export default Table;


/* eslint-disable react/jsx-key */

import fetchDataGrid from '../lib/fetchDatagrid';
import FloatCell from './cells/float/FloatCell';
import TextCell from './cells/text/TextCell';
const cellMap = {
    TEXT: {
        component: TextCell,
    },
    FLOAT: {
        component: FloatCell
    }
}

const Table = async ({ query, matrices }) => {
    const data = await fetchDataGrid(query)
    const { columnTypes, columns, rows, total, typeMap, displayColumns } = data;

    // TODO Clean up
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
                            Object.values(row).map( (cell, cidx) => (
                                !!cellMap?.[columnTypes[cidx]] ? cellMap?.[columnTypes[cidx]]?.component({cell}) : <div>{`${cell} - ${columnTypes[cidx]}`}</div> 
                            ))
                        }
                    </div>
                ))}
            </div>
    );
};

export default Table;


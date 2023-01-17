/* eslint-disable react/jsx-key */

import fetchDataGrid from '../../lib/fetchDatagrid';
import Cell from '../cells/base';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
import EMPTY from '../../lib/consts/emptyTable';
import { Suspense } from 'react';

const cx = classNames.bind(styles)

export const TableDisplay = ({ query, data }) => {
    const { columnTypes, columns, rows, displayColumns } = data;
    
    // Remove any row keys that are not in displayColumns:
    const displayRows = rows.map(row => Object.fromEntries(
	    Object.entries(row).filter(([name]) => displayColumns.includes(name))
    ));

    return (
        <div className={styles.tableRoot}>
            {[ displayColumns, ...displayRows ]?.map((row, ridx) => (
                <div className={cx('row', { group: !!query?.groupBy, headerRow: ridx < 1 })} key={`row-${ridx}`}>
                    {
                        Object.values(row).map( (cell, cidx) => (
                            <Cell 
                                value={cell} 
                                type={columnTypes[cidx]} 
                                columnName={columns[cidx]} 
                                query={query} 
                                isHeader={ridx < 1} 
                            />
                        ) )
                    }
                </div>
                ))}
        </div>
    )

}
const Table = async ({ query }) => {
    const data = await fetchDataGrid(query)
    console.log(data);

    return (
        <Suspense fallback={<TableDisplay data={EMPTY} query={query} />}>
            <TableDisplay data={data} query={query} />            
        </Suspense>
    );
};

export default Table;

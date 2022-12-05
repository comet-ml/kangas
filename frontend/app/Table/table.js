/* eslint-disable react/jsx-key */

import fetchDataGrid from '../../lib/fetchDatagrid';
import Cell from '../cells/base';
import styles from './Table.module.scss';
import cellStyles from '../cells/Cell.module.scss'
const Table = async ({ query }) => {
    const data = await fetchDataGrid(query)
    const { columnTypes, columns, rows, total, typeMap, displayColumns } = data;

    const rowClass = !!query?.groupBy ? styles.rowGroup : styles.row;
    const colClass = !!query?.groupBy ? 'column-group cell-group' : 'column cell';
    const headerClass = !!query?.groupBy ? 'column-group' : 'column';
    return (
            <div className={styles.tableRoot}>
                <div id={styles.headerRow} className={styles.row}>
                    {displayColumns?.map((col) => (
                        <div className={cellStyles.cell} title={col}>
                            {col}
                        </div>
                    ))}
                </div>
                {rows?.map((row, ridx) => (
                    <div className={styles.row} key={`row-${ridx}`}>
                        {
                            Object.values(row).map( (cell, cidx) => <Cell value={cell} type={columnTypes[cidx]} dgid={query?.dgid} /> )
                        }
                    </div>
                ))}
            </div>
    );
};

export default Table;


/* eslint-disable react/jsx-key */

import fetchDataGrid from '../../lib/fetchDatagrid';
import Cell from '../cells/base';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
import ViewProvider from '../contexts/ViewContext';
import defaultCellSizes from '../../lib/consts/defaultCellSizes';

const cx = classNames.bind(styles)

const Table = async ({ query }) => {
    const data = await fetchDataGrid(query)
    const { columnTypes, columns, rows, typeMap, displayColumns } = data;
    const view = Object.fromEntries( columns.map( ( col, idx ) => [ col, defaultCellSizes?.[ columnTypes[idx ] ] ] ) );
    return (
            <div className={styles.tableRoot}>
                <ViewProvider value={{ columns: view }}>
                    {[ displayColumns, ...rows ]?.map((row, ridx) => (
                        <div className={cx('row', { group: !!query?.groupBy, headerRow: ridx < 1 })} key={`row-${ridx}`}>
                            {
                                Object.values(row).map( (cell, cidx) => (
                                    <Cell value={cell} type={columnTypes[cidx]} columnName={columns[cidx]} query={query} isHeader={ridx < 1} />
                                ) )
                            }
                        </div>
                    ))}
                </ViewProvider>
            </div>
    );
};

export default Table;

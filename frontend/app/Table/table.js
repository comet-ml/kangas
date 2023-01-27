/* eslint-disable react/jsx-key */

import fetchDataGrid from '../../lib/fetchDatagrid';
import { Cell } from '../cells/base';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
import EMPTY from '../../lib/consts/emptyTable';
import { Suspense } from 'react';
import Skeleton from '../Skeleton';

const cx = classNames.bind(styles)

const transpose = (matrix) => {
    return matrix.reduce((prev, next) => Object.values(next).map((item, i) =>
      (prev[i] || []).concat(Object.values(next)[i])
    ), []);
  }

  export const TableDisplay = ({ query, data }) => {
    const { columnTypes, columns, rows, displayColumns } = data;

    // Remove any row keys that are not in displayColumns:
    const displayRows = rows.map(row => Object.fromEntries(
	    Object.entries(row).filter(([name]) => displayColumns.includes(name))
    ));

    const transposed = transpose([ displayColumns, ...displayRows ]);

    return (
        <div className={styles.tableRoot}>
            {transposed?.map((column, colidx) => (
                <div className={cx('column')} key={`col-${colidx}`}>
                    {
                        Object.values(column).map( (cell, cidx) => (
                            <Suspense fallback={<Skeleton message={`suspending ${cell} - ${colidx}/${cidx}`} />}>
                                <Cell
                                    value={cell}
                                    type={columnTypes[colidx]}
                                    columnName={columns[colidx]}
                                    query={query}
                                    isHeader={cidx < 1}
                                />
                            </Suspense>
                        ) )
                    }
                </div>
                ))}
        </div>
    );

};
/*
const Table = async ({ query }) => {
    const data = await fetchDataGrid(query);

    return (
        <Suspense fallback={<TableDisplay data={EMPTY} query={query} />}>
            <TableDisplay data={data} query={query} />
        </Suspense>
    );
};
 */
export default TableDisplay;

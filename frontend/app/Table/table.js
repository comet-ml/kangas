/* eslint-disable react/jsx-key */

import fetchDataGrid from '../../lib/fetchDatagrid';
import Cell from '../cells/base';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
import EMPTY from '../../lib/consts/emptyTable';
import { Suspense } from 'react';

const cx = classNames.bind(styles)

function transpose(matrix) {
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
    console.log('I AM TRANSPOSED')
    console.log(transposed)

    return (
        <div className={styles.tableRoot}>
            {transposed?.map((column, colidx) => (
                <div className={cx('column')} key={`col-${colidx}`}>

                    {
                        Object.values(column).map( (cell, cidx) => (
                            <Cell
                                value={cell}
                                type={columnTypes[cidx]}
                                columnName={columns[cidx]}
                                query={query}
                                isHeader={colidx < 1}
                            />
                        ) )
                    }
                </div>
                ))}
        </div>
    )

}
const Table = async ({ query }) => {
    const data = await fetchDataGrid(query);

    return (
        <Suspense fallback={<TableDisplay data={EMPTY} query={query} />}>
            <TableDisplay data={data} query={query} />
        </Suspense>
    );
};

export default Table;

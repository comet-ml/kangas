/* eslint-disable react/jsx-key */

import Cell from '../cells/base';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
import { Suspense } from 'react';
import Skeleton from '../Skeleton';

const cx = classNames.bind(styles);

const transpose = (matrix) => {
    return matrix.reduce((prev, next) => Object.values(next).map(
        (item, i) =>
            (prev[i] || []).concat(Object.values(next)[i])
    ), []);
};

export const TableDisplay = ({ query, data }) => {
    const { columnTypes, columns, rows, displayColumns } = data;
    const transposeTable = false;

    // Remove any row keys that are not in displayColumns:
    const displayRows = rows.map(row => Object.fromEntries(
	Object.entries(row).filter(([name]) => displayColumns.includes(name))
    ));


    if (transposeTable) {
        const transposed = transpose([ displayColumns, ...displayRows ]);

        return (
                <div className={styles.tableRoot} style={{display: 'flex'}}>
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
    } else {

      return (
        <div className={styles.tableRoot} style={{display: 'unset'}}>
            {[ displayColumns, ...displayRows ]?.map((row, ridx) => (
                <div className={cx('row', { group: !!query?.groupBy, headerRow: ridx < 1 })} key={`row-${ridx}`}>
                    {
                        Object.values(row).map( (cell, cidx) => (
                          <Suspense fallback={<Skeleton message={`suspending ${cell} - ${cidx}`} />}>
                            <Cell
                                value={cell}
                                type={columnTypes[cidx]}
                                columnName={columns[cidx]}
                                query={query}
                                isHeader={ridx < 1}
                            />
                          </Suspense>
                        ) )
                    }
                </div>
                ))}
        </div>
     );
   }
};

export default TableDisplay;

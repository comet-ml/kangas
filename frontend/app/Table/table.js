/* eslint-disable react/jsx-key */

import Cell from '@kangas/app/cells/base';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
import { Suspense } from 'react';
import Skeleton from '@kangas/app/Skeleton';
import TableClientWrapper from './TableClientWrapper';

const cx = classNames.bind(styles);

const CellSorter = ({ cell, cidx, start, end, row, columns, columnTypes, ridx, query}) => {

    if (!query?.groupBy) {
        return (
            <Cell
                value={row[columns[cidx]]}
                type={columnTypes[cidx]}
                columnName={columns[cidx]}
                query={query}
                isHeader={ridx < 1}
                cidx={cidx}
            />
        )
    }

    if (cidx > end || cidx < start) {
        return (
            <Cell
                value={row[columns[cidx]]}
                type={columnTypes[cidx]}
                columnName={columns[cidx]}
                query={query}
                isHeader={ridx < 1}
                cidx={cidx}
            />
        )

    }

    return (
        <Cell
            value={row[columns[cidx]]}
            type={columnTypes[cidx]}
            columnName={columns[cidx]}
            query={query}
            isHeader={ridx < 1}
            cidx={cidx}
            ssr={true}
        />
    )
}


export const TableDisplay = ({ query, data, start=0, end=10 }) => {
    const { columnTypes, columns, rows, displayColumns } = data;

    // Remove any row keys that are not in displayColumns:
    const displayRows = rows.map(row => Object.fromEntries(
        Object.entries(row).filter(([name]) => displayColumns.includes(name))
    ));

      return (
        <TableClientWrapper data={data}>
            <div className={styles.tableRoot}>
                {[ displayColumns, ...displayRows ]?.map((row, ridx) => (
                    <div className={cx('row', { group: !!query?.groupBy, headerRow: ridx < 1 })} key={`row-${ridx}`}>
                        {
                            Object.values(row).map( (cell, cidx) => (
                            <Suspense fallback={<Skeleton message={`suspending ${cell} - ${cidx}`} />}>
                                <CellSorter
                                    cell={cell}
                                    cidx={cidx}
                                    row={row}
                                    query={query}
                                    start={start}
                                    end={end}
                                    columns={columns}
                                    columnTypes={columnTypes}
                                    ridx={ridx}
                                />
                            </Suspense>
                            ) )
                        }
                    </div>
                    ))}
            </div>
        </TableClientWrapper>
     );
   }

export default TableDisplay;

/* eslint-disable react/jsx-key */

import fetchDataGrid from '../../lib/fetchDatagrid';
import Cell from '../cells/base';
import DialogueModal from '../modals/DialogueModal/DialogueModalClient';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles)

const Table = async ({ query }) => {
    const data = await fetchDataGrid(query)
    const { columnTypes, columns, rows, total, typeMap, displayColumns } = data;
    return (
            <div className={styles.tableRoot}>
                <div className={cx(['headerRow', 'row'])}>
                    {displayColumns?.map((col) => (
                        <div className={cx('cell')} title={col}>
                            {col}
                        </div>
                    ))}
                </div>
                {rows?.map((row, ridx) => (
                    <div className={cx('row', { group: !!query?.groupBy })} key={`row-${ridx}`}>
                        {
                            Object.values(row).map( (cell, cidx) => <Cell value={cell} type={columnTypes[cidx]} dgid={query?.dgid} isGrouped={!!query?.groupBy} /> )
                        }
                    </div>
                ))}
            </div>
    );
};

export default Table;


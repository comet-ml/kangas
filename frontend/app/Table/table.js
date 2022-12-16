/* eslint-disable react/jsx-key */

import fetchDataGrid from '../../lib/fetchDatagrid';
import Cell from '../cells/base';
import DialogueModal from '../modals/DialogueModal/DialogueModalClient';
import styles from './Table.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles)

const Table = async ({ query }) => {
    const data = await fetchDataGrid(query)
    const { columnTypes, columns, rows, typeMap, displayColumns } = data;
    const view = {
	columns: columns.map( (name, cidx) => (
	    {
		name,
		type: columnTypes[cidx],
		style: {
		    width: '200px',
		    height: '55px',
		    'max-width': 'unset',
		},
	    }
	)),
    };

    return (
            <div className={styles.tableRoot}>
                <div className={cx(['headerRow', 'row'])}>
            {displayColumns?.map((col, idx) => (
                    <div className={cx('cell')} title={col} style={view.columns[idx].style}>
                            {col}
                        </div>
                    ))}
                </div>
                {rows?.map((row, ridx) => (
                    <div className={cx('row', { group: !!query?.groupBy })} key={`row-${ridx}`}>
                        {
                            Object.values(row).map( (cell, cidx) => (
                                    <Cell value={cell} style={view.columns[cidx].style} type={columnTypes[cidx]} columnName={columns[cidx]} query={query} />
                            ) )
                        }
                    </div>
                ))}
            </div>
    );
};

export default Table;

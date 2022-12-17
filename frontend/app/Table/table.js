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

    // Get some defaults for column styles, maybe from backend:
    const defaultStyles = {};
    for (let columnType of columnTypes) {
	defaultStyles[columnType] = {
	    height: '55px',
	    'maxWidth': 'unset',
	};
	if (columnType === 'TEXT')
	    defaultStyles[columnType].width = '200px';
	else if (columnType === 'IMAGE-ASSET')
	    defaultStyles[columnType].width = '150px';
	else if (columnType === 'FLOAT')
	    defaultStyles[columnType].width = '100px';
	else if (columnType === 'INTEGER')
	    defaultStyles[columnType].width = '100px';
	else if (columnType === 'JSON')
	    defaultStyles[columnType].width = '400px';
	else {
	    defaultStyles[columnType].width = '100px';
	}
    };
    // Get the default or saved view for this datagrid:
    const view = {
	columns: columns.reduce((accumulate, name, cidx) =>
	    (accumulate[name] = {
		type: columnTypes[cidx],
		style: defaultStyles[columnTypes[cidx]],
	    }, accumulate), {}),
    };

    return (
            <div className={styles.tableRoot}>
                <div className={cx(['headerRow', 'row'])}>
                    {displayColumns?.map((col, idx) => (
                        <div className={cx('cell')} title={col} style={view.columns[col].style}>
                            {col}
                        </div>
                    ))}
                </div>
                {rows?.map((row, ridx) => (
                    <div className={cx('row', { group: !!query?.groupBy })} key={`row-${ridx}`}>
                        {
                            Object.values(row).map( (cell, cidx) => (
                                    <Cell value={cell} style={view.columns[columns[cidx]].style} type={columnTypes[cidx]} columnName={columns[cidx]} query={query} />
                            ) )
                        }
                    </div>
                ))}
            </div>
    );
};

export default Table;

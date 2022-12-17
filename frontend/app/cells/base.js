// This is the base cell class. Mostly, this is used for wrapping everything in <Suspense />

import FloatCell from './float';
import ImageCell from './image';
import JSONCell from './json/JSONCell';
import TextCell from './text';
import styles from './Cell.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const cellMap = {
    TEXT: {
        component: TextCell,
    },
    FLOAT: {
        component: FloatCell
    },
    'IMAGE-ASSET': {
        component: ImageCell
    },
    JSON: {
        component: JSONCell
    },
    INTEGER: {
        component: TextCell,
    },
}

const Cell = async ({ value, columnName, type, query, style }) => {
    const Component = cellMap?.[type]?.component;
    return (
        <div className={cx('cell')} >
            { !!Component && <Component value={value} columnName={columnName} query={query} style={style} />}
            { !Component && <div style={style}>{`${value}`}</div> }
        </div>
    )
}

export default Cell;

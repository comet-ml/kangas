// This is the base cell class. Mostly, this is used for wrapping everything in <Suspense />

import FloatCell from './float/FloatCell';
import ImageCell from './image/ImageCell';
import JSONCell from './json/JSONCell';
import TextCell from './text/TextCell';
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

const Cell = async ({ value, type, dgid }) => {
    const Component = cellMap?.[type]?.component;
    return (
        <div className={cx('cell')}>
            { !!Component && <Component value={value} dgid={dgid} />}
            { !Component && <div>{`${value} - ${type}`}</div> }
        </div>
    )
}

export default Cell;
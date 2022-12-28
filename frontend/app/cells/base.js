// This is the base cell class. Mostly, this is used for wrapping everything in <Suspense />

import FloatCell from './float';
import ImageCell from './image';
import JSONCell from './json/JSONCell';
import TextCell from './text';
import styles from './Cell.module.scss';
import classNames from 'classnames/bind';
import CellClient from './baseClient';
import Header from './header';

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
    ROW_ID: {
        component: TextCell
    }
}

const Cell = async ({ value, columnName, type, query, style, isHeader }) => {
    const Component = cellMap?.[type]?.component;

    if (isHeader) {
        return (
            <CellClient columnName={columnName} type={type} isHeader={true}>
                <Header columnName={columnName} />
            </CellClient>
        )
    }

    return (
        <CellClient columnName={columnName} type={type}>
            { !!Component && <Component value={value} query={query} style={style} />}
            { !Component && <div style={style}>{`${value}`}</div> }
        </CellClient>
    )
}

export default Cell;

// This is the base cell class. Mostly, this is used for wrapping everything in <Suspense />
import { Suspense } from 'react';
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

const HeaderCell = ({ columnName, type }) => {
    return (
        <CellClient columnName={columnName} type={type} isHeader={true}>
            <Header columnName={columnName} />
        </CellClient>
    )
}

const Cell = async ({ value, columnName, type, query, isHeader }) => {
    const Component = cellMap?.[type]?.component;

    if (isHeader) {
        return (
            <HeaderCell columnName={columnName} type={type} />
        )
    }

    return (
        <CellClient columnName={columnName} type={type}>
            { !!Component && <Component value={value} query={query} />}
            { !Component && <div>{`${value}`}</div> }
        </CellClient>
    )
}

export default Cell;

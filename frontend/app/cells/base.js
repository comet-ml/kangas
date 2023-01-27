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
        width: 200,
        groupedWidth: 200,
        component: TextCell,
    },
    FLOAT: {
        width: 150,
        groupedWidth: 200,
        component: FloatCell
    },
    INTEGER: {
        width: 100,
        groupedWidth: 200,
        component: TextCell,
    },
    JSON: {
        width: 400,
        groupedWidth: 200,
        component: JSONCell

    },
    'IMAGE-ASSET': {
        width: 150,
        groupedWidth: 300,
        component: ImageCell
    },
    ROW_ID: {
        width: 50,
        groupedWidth: 50,
        component: TextCell
    }
};

const getDefaultCellSize = (cellType, grouped) => {
    if (grouped) {
        if (typeof(cellMap[cellType]) !== 'undefined') {
            return cellMap[cellType].groupedWidth;
        }
    }
    // Not grouped:
    if (typeof(cellMap[cellType]) !== 'undefined') {
        return cellMap[cellType].width;
    }
    console.log(`ERROR: missing cell type: ${cellType}`);
    return 200;
};

const HeaderCell = ({ columnName, type }) => {
    return (
        <CellClient columnName={columnName} type={type} isHeader={true}>
            <Header columnName={columnName} />
        </CellClient>
    );
}

const Cell = async ({ value, columnName, type, query, isHeader }) => {
    const Component = cellMap?.[type]?.component;

    if (isHeader) {
        return (
           <HeaderCell columnName={columnName} type={type} grouped={query?.groupBy}/>
        );
    };

    return (
        <CellClient columnName={columnName} type={type} grouped={query?.groupBy}>
            { !!Component && <Component value={value} query={query} />}
            { !Component && <div>{`${value}`}</div> }
        </CellClient>
    );
};

export { Cell, getDefaultCellSize };



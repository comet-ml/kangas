'use client';

import { useContext, useCallback } from "react";
import { ViewContext } from "../contexts/ViewContext";
import classNames from 'classnames/bind';
import styles from './Cell.module.scss';
import { Resizable } from 're-resizable';
import defaultCellSizes from "../../lib/consts/defaultCellSizes";

const cx = classNames.bind(styles);

const CellClient = ({ columnName, type, isHeader, children }) => {
    const { columns, updateWidth } = useContext(ViewContext);
    const resize = useCallback((d) => {
        updateWidth({
            [columnName]: {
                width: defaultCellSizes[type].width + d.width
            }
        })
    }, [columnName, columns]);

    return (
        <Resizable 
            className={cx('cell', { header: isHeader})} 
            size={{
                width: columns?.[columnName]?.width,
                height: 0
            }}
            enable={{
                right: true
            }}
            onResize={(e, direction, ref, d) => {
                resize(d)
            }}            
        >
            { children }
        </Resizable>
    )
}

export default CellClient;
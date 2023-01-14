'use client';

import { useContext, useCallback, useState, useEffect } from "react";
import { ViewContext } from "../contexts/ViewContext";
import classNames from 'classnames/bind';
import styles from './Cell.module.scss';
import { Resizable } from 're-resizable';
import defaultCellSizes from "../../lib/consts/defaultCellSizes";

const cx = classNames.bind(styles);


/*
The startResizing/stopResizing/initWidth dynamic is potentially a bit confusing.
The gist is that we need to update the width of every cell in a column as we resize
a given cell. Because of the way react-resizable works under the hood, simply updating
the cell widths via onResize will often lead to the widths of different cells falling out of sync.
Using the startResizing/stopResizing/initWidth dynamic, we can force all widths to stay in sync.
*/

const CellClient = ({ columnName, type, isHeader, children }) => {
    const { columns, updateWidth } = useContext(ViewContext);
    const [isResizing, setIsResizing] = useState(false);
    const [initWidth, setInitWidth] = useState(defaultCellSizes[type]?.width || 0)

    const resize = useCallback((d) => {
        updateWidth({
            [columnName]: {
                width: initWidth + (d?.width ?? 0)
            }
        })
    }, [columnName, initWidth]);

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);

    useEffect(() => {
        if (!isResizing && (columns?.[columnName]?.width !== initWidth)) {
            setInitWidth(columns?.[columnName]?.width ?? initWidth)
        }
    }, [isResizing, columns?.[columnName]?.width, initWidth])

    const headerResizeStyle = {
	'width': '1px',
	'background-color': 'silver',
	'border': '2px ridge silver',
	'border-radius': '2px',
	'right': '0px',
	'height': '100%',
	'top': '-2px',
    };


    return (
        <Resizable
            className={cx('cell', { header: isHeader})}
            handleStyles={isHeader ? {'right': headerResizeStyle} : {'right': {'background-color': '#fafafa'}}}
            size={{
                width: columns?.[columnName]?.width ?? initWidth,
                height: 0
            }}
            enable={{
                right: true
            }}
            onResizeStart={startResizing}
            onResize={(e, direction, ref, d) => {
                resize(d)
            }}
            onResizeStop={stopResizing}
        >
            { children }
        </Resizable>
    )
}

export default CellClient;

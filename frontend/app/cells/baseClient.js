'use client';

import { useContext, useCallback, useState, useEffect, useMemo, useRef } from "react";
import useDebounce from "@kangas/lib/hooks/useDebounce";
import { ViewContext } from "@kangas/app/contexts/ViewContext";
import classNames from 'classnames/bind';
import styles from './Cell.module.scss';
import { Resizable } from 're-resizable';
import { useInView } from "react-intersection-observer";
import getDefaultCellSize from "@kangas/lib/getDefaultCellSize";

const cx = classNames.bind(styles);


/*
The startResizing/stopResizing/initWidth dynamic is potentially a bit confusing.
The gist is that we need to update the width of every cell in a column as we resize
a given cell. Because of the way react-resizable works under the hood, simply updating
the cell widths via onResize will often lead to the widths of different cells falling out of sync.
Using the startResizing/stopResizing/initWidth dynamic, we can force all widths to stay in sync.
*/

const CellClient = ({ columnName, type, isHeader, children, grouped, cidx }) => {
    const { columns, updateWidth, view, updateView } = useContext(ViewContext);
    const [isResizing, setIsResizing] = useState(false);
    const [width, setWidth] = useState(getDefaultCellSize(type, grouped));
    const { ref, inView, entry } = useInView({ threshold: 0 });
    const debounceUpdateView = useDebounce(updateView, 1000);

    const resize = useCallback((d) => {
        updateWidth({
            [columnName]: {
                width: width + (d?.width ?? 0)
            }
        });
    }, [columnName, width]);

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);

    useEffect(() => {
        if (!isResizing && (columns?.[columnName]?.width !== width)) {
            setWidth(columns?.[columnName]?.width ?? width);
        }
    }, [isResizing, columns?.[columnName]?.width, width]);

    useEffect(() => {
        if (inView) {
            if (cidx > view?.stop) {
                debounceUpdateView({ view: {
                    stop: cidx,
                    start: Math.max(cidx - 12, 0)
                }})
            } else if (cidx < view?.stop - 12) {
                debounceUpdateView({ view: {
                    start: cidx,
                    stop: cidx + 12
                }})
            }
        } else {
            /*
            const closerToEnd = (Math.abs(view?.stop - cidx) < Math.abs(view?.start - cidx))
            if (closerToEnd) {
                if (cidx < view?.stop) {
                    debounceUpdateView({ view: {
                        stop: cidx
                    }})
                }
            } else {
                if (cidx > view?.start) {
                    debounceUpdateView({ view: {
                        start: cidx
                    }})
                }
            }
        } */
    }
      }, [inView]);


    const headerResizeStyle = {
        'width': '1px',
        'backgroundColor': 'silver',
        'border': '2px ridge silver',
        'borderRadius': '2px',
        'right': '0px',
        'height': '100%',
        'top': '-2px',
    };

    return (
        <Resizable
            className={cx('cell', { header: isHeader, group: grouped})}
            handleStyles={isHeader ? {'right': headerResizeStyle} : {'right': {'backgroundColor': '#fafafa'}}}
            size={{
                width,
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
            <div ref={ref} className={cx('cell-div')} style={ {width: 'inherit'} }>
                { children }
            </div>
        </Resizable>
    )
}

export default CellClient;

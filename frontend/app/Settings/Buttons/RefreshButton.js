'use client';

import CachedIcon from '@mui/icons-material/Cached';
import { useCallback, useContext } from 'react';
import useQueryParams from '@kangas/lib/hooks/useQueryParams';

import styles from './RefreshButton.module.scss';
import classNames from 'classnames/bind';
import { ViewContext } from '@kangas/app/contexts/ViewContext';
const cx = classNames.bind(styles);

const RefreshButton = ({ query }) => {
    const { params, updateParams } = useQueryParams();
    const { columns, view } = useContext(ViewContext);


    const clearCache = useCallback(() => {
	// Reset params:
        updateParams({
            sort: undefined,
            group: undefined,
            page: undefined,
            rows: undefined,
            filter: undefined,
            descending: undefined,
            select: undefined,
	    cc: undefined,
            begin: Math.max(view?.start, 0),
            boundary: view?.stop
        });
    });

    return (
        <div className={cx('refresh-button')} onClick={clearCache}>
            <CachedIcon className={cx("cached-icon")} />
        </div>
    );

};

export default RefreshButton;

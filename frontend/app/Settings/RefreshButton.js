'use client';

import CachedIcon from '@mui/icons-material/Cached';
import { useCallback } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';

import styles from './RefreshButton.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const RefreshButton = ({ query }) => {
    const { params, updateParams } = useQueryParams();

    const clearCache = useCallback(() => {
	// Reset params:
        updateParams({
            sort: undefined,
            group: undefined,
            page: undefined,
            rows: undefined,
	    filter: undefined,
	    descending: undefined,
	    select: undefined
        });
	// FIXME: do something here to force cache delete or update
    });

    return (
        <div className={cx('refresh-button')} onClick={clearCache}>
            <CachedIcon className={cx("cached-icon")} />
        </div>
    );

};

export default RefreshButton;

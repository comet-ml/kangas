'use client';

import CachedIcon from '@mui/icons-material/Cached';
import { useCallback, useContext, useEffect } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';

import styles from './RefreshButton.module.scss';
import classNames from 'classnames/bind';
import { ViewContext } from '../contexts/ViewContext';
import { ConfigContext } from '../contexts/ConfigContext';
const cx = classNames.bind(styles);


const RefreshButton = ({ query }) => {
    const { params, updateParams } = useQueryParams();
    const { columns, view } = useContext(ViewContext);
    const { config } = useContext(ConfigContext);

    const checkForUpdates = useCallback(async () => {
        if (!!query?.timestamp) {
            try {
                fetch(`${config.rootUrl}api/timestamp?dgid=${query?.dgid}`).then(async res => {
                    const currentTimestamp = (await res.json()).timestamp;
                    if (!!currentTimestamp) {
                        if (query.timestamp !== currentTimestamp)
                            updateParams({...params});
                    }
                });
            } catch (error) {
                console.log(error);
            }
        }
    }, [query?.timestamp, query?.dgid, params, updateParams]);

    useEffect(async () => {
        const interval = setInterval(async () => {
            await checkForUpdates();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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

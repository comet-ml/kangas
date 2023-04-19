'use client';

import Select from 'react-select';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';

import classNames from 'classnames/bind';
import styles from './MatrixSelectClient.module.scss';
import { ConfigContext } from '../contexts/ConfigContext';
const cx = classNames.bind(styles);


// Ideally, we wouldn't need to import a third-party library for a select component here,
// but native select components are annoying to style
const MatrixSelect = ({ query, options=['blah'] }) => {
    const { params, updateParams, prefetch } = useQueryParams();
    const { config } = useContext(ConfigContext)

    const changeDatagrid = useCallback((e) => {
        updateParams({
            datagrid: e.value,
            filter: undefined,
            sort: undefined,
            group: undefined,
            descending: undefined,
            page: undefined,
            rows: undefined,
            select: undefined,
	    cc: undefined,
        });
    }, [updateParams]);

    const customStyles = {
        menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
        control: (provided) => ({ ...provided, height: '36px', minHeight: 'unset', marginBottom: '10px' })
    };

    // FIXME: don't use endsWith, but something smarter
    return (!config.hideSelector &&
        <Select
            className={cx('matrix-select')}
            value={
                options?.find((item) => item?.value?.endsWith(params?.datagrid)) || ''
            }
            options={options}
            styles={customStyles}
            onChange={changeDatagrid}
        />
    );
};

export default MatrixSelect;

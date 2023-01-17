/* eslint-disable react/jsx-key */
'use client';

import config from '../../config';

import { useCallback, useMemo, useEffect, useRef } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';
import RowsButton from '../Settings/Buttons/RowsButton';
import AboutDataGridButton from '../Settings/Buttons/AboutDataGridButton';

import styles from './Pager.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const Pager = ({ firstRow, totalRows, currentPage, totalPages, maxRow, pageSize }) => {
    const { params, updateParams } = useQueryParams();
    const pageInput = useRef();

    const canGoto = (page) => {
	return page > 0 && page <= totalPages && page !== currentPage;
    };

    const gotoPage = useCallback((page) => {
        if (canGoto(page)) {
            updateParams({
                page
            });
        }
    }, [updateParams]);

    const setPageSize = useCallback((pagesize) => {
        updateParams({
            rows: pagesize,
	    page: 1,
        });
    }, [updateParams]);

    const enter = useCallback((e) => {
        if (e?.keyCode === 13 || e?.code === 'Enter') {
            const page = parseInt(e.target.value);
            if (page) gotoPage(page);
        }
    }, [gotoPage]);

    useEffect(() => {
        if (pageInput?.current) pageInput.current.value = currentPage;
    }, [currentPage]);

    const notGotoFirst = useMemo(() => {
	return !canGoto(1);
    }, [currentPage, totalPages]);

    const notGotoLast = useMemo(() => {
	return !canGoto(totalPages);
    }, [currentPage, totalPages]);

    const notGotoNext = useMemo(() => {
	return !canGoto(currentPage + 1);
    }, [currentPage, totalPages]);

    const notGotoPrevious = useMemo(() => {
	return !canGoto(currentPage - 1);
    }, [currentPage, totalPages]);

    return (
        <div className={cx('pagination')}>
            <AboutDataGridButton />
	    <span>
	    Showing {`${firstRow.toLocaleString(config.locale)} - ${maxRow.toLocaleString(config.locale)} of ${totalRows.toLocaleString(config.locale)} rows`}
            </span>
            <button
               className={cx('rounded')}
	       onClick={() => gotoPage(1)}
	       disabled={notGotoFirst}
            >
	      {'|<'}
            </button>
            <button
               className={cx('rounded')}
	       onClick={() => gotoPage(currentPage - 1)}
	       disabled={notGotoPrevious}
            >
	      {'<'}
            </button>
	    <span>
	    Page
            </span>
            <input
                type="text"
                inputMode='numeric'
                pattern="[0-9]*"
                onKeyDown={(e) => enter(e)}
                disabled={totalPages === 1}
                ref={pageInput}
                defaultValue={currentPage}
                style={{
                        width: '50px',
                        margin: '0 8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '500',
                }}
            />
	    <span>
	    of {`${totalPages.toLocaleString(config.locale)}`}
            </span>
            <button
               className={cx('rounded')}
	       onClick={() => gotoPage(currentPage + 1)}
	       disabled={notGotoNext}
            >
	      {'>'}
            </button>
            <button
               className={cx('rounded')}
	       onClick={() => gotoPage(totalPages)}
	       disabled={notGotoLast}
            >
	      {'>|'}
            </button>
            <RowsButton />
        </div>
    );
};

export default Pager;

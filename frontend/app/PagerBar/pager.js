/* eslint-disable react/jsx-key */
'use client';

import { useCallback, useMemo } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';

import styles from './Pager.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const Pager = ({ firstRow, totalRows, currentPage, totalPages, maxRow, pageSize }) => {
    const { params, updateParams } = useQueryParams();

    const gotoPage = useCallback((page) => {
        updateParams({
            page
        });
    }, [updateParams]);

    const setPageSize = useCallback((pagesize) => {
        updateParams({
            rows: pagesize,
	    page: 1,
        });
    }, [updateParams]);

    const canGoto = (page) => {
	return page > 0 && page <= totalPages && page !== currentPage;
    };

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
	    <span>
	    Showing {`${firstRow} - ${maxRow} of ${totalRows} rows`}: Page {`${currentPage}  / ${totalPages}`}
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
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
              }}
            >
              {[5, 10, 15, 20, 25].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
        </div>
    );
};

export default Pager;

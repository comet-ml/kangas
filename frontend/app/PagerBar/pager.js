/* eslint-disable react/jsx-key */
'use client';

import DownloadIcon from '@mui/icons-material/Download';

import { useCallback, useMemo, useEffect, useRef, useContext } from 'react';
import useQueryParams from '@kangas/lib/hooks/useQueryParams';
import RowsButton from '@kangas/app/Settings/Buttons/RowsButton';
import AboutDataGridButton from '@kangas/app/Settings/Buttons/AboutDataGridButton';
import { ConfigContext } from '@kangas/app/contexts/ConfigContext';

import styles from './Pager.module.scss';
import classNames from 'classnames/bind';
import { ViewContext } from '@kangas/app/contexts/ViewContext';
const cx = classNames.bind(styles);

const Pager = ({ dgid, aboutText, firstRow, totalRows, currentPage, totalPages, maxRow, pageSize }) => {
    const { config } = useContext(ConfigContext);
    const { beginLoading } = useContext(ViewContext);
    const { params, updateParams } = useQueryParams();
    const pageInput = useRef();
    const aboutButton = aboutText !== '' ? (<AboutDataGridButton text={aboutText} />) : (<></>);
    const downloadName = dgid && dgid.includes("/") ? dgid.substring(dgid.lastIndexOf("/") + 1) : dgid;
    const downloadLink = (totalPages > 0 && !config.hideSelector) ? (<a href={`${config.rootPath}api/download?dgid=${dgid}`} download={downloadName}><DownloadIcon/></a>) : (<></>);

    const getLocaleString = (text) => {
        if (text) {
            return text.toLocaleString(config.locale);
        }
        return null;
    };

    const canGoto = (page) => {
        return page > 0 && page <= totalPages && page !== currentPage;
    };

    const gotoPage = useCallback((page) => {
        if (canGoto(page)) {
            updateParams({
                page
            });
            beginLoading();
        }
    }, [updateParams, beginLoading]);

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
          <div className={cx("left-bar")}>
            {aboutButton}
            {downloadLink}
          </div>
          <div className={cx("right-bar")}>
            <span>
                Showing {`${getLocaleString(firstRow)} - ${getLocaleString(maxRow)} of ${getLocaleString(totalRows)} rows`}
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
                disabled={totalPages <= 1}
                ref={pageInput}
                defaultValue={currentPage}
                style={{
                        width: '50px',
                        margin: '0 8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '500',
                        height: '25px',
                }}
            />
            <span>
                of {`${getLocaleString(totalPages)}`}
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
          </div>
        </div>
    );
};

export default Pager;

import config from '../../config';

import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';
import { useCallback, useMemo, useRef, useEffect } from 'react';

const Paging = ({ query, pagination, total }) => {
    const refresh = useRefreshRoot();
    const max = useMemo(() => Math.ceil(total / query?.limit), [total, query?.limit]);
    const pageInput = useRef();

    const changePage = useCallback(
        (page) => {
            const offset = (page - 1) * query?.limit;
            if (
                offset < 0 ||
                offset === query?.offset ||
                page - 1 >= total / query?.limit
            )
                return;
            refresh({
                query: {
                    ...query,
                    offset,
                },
            });
        },
        [query]
    );

    const enter = useCallback((e) => {
        if (e?.keyCode === 13 || e?.code === 'Enter') {
            const page = parseInt(e.target.value);
            if (page) changePage(page);
        }
    }, [changePage]);

    const currentPage = useMemo(() => {
        if (!query?.offset) return 1;
        const ratio = Math.ceil(query?.offset / query?.limit);
        return ratio + 1;
    }, [query]);

    const pageForward = useCallback(() => {
        changePage(currentPage + 1);
    }, [currentPage, changePage]);

    const pageBack = useCallback(() => {
        changePage(currentPage - 1);
    }, [currentPage, changePage]);

    const rowsMessage = useMemo(() => {
        if (!total) return 'No matching rows';
        if (total === 1) return 'Showing 1 matching row';

        if (pagination?.length > 1) {
            const startRow = ((query?.offset || 0) + 1).toLocaleString(config.locale);
            const endRow = Math.min(
                (query?.offset || 0) + query?.limit,
                total
            ).toLocaleString(config.locale);

            return `Showing ${startRow} - ${endRow} rows of ${total.toLocaleString(config.locale)}`
        }

        return `Showing all matching rows`
    }, [total, config, query, pagination]);

    useEffect(() => {
        if (pageInput?.current) pageInput.current.value = currentPage;
    }, [currentPage])


    return (
        <div className="pagination">
            {`${rowsMessage} `}
            {pagination.length > 1 && (
                <div>
                    Page:
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() => changePage(1)}
                    >{` |< `}</span>
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={pageBack}
                    >{`<`}</span>
                    <input
                        type="text"
                        inputMode='numeric'
                        pattern="[0-9]*"
                        onKeyDown={(e) => enter(e)}
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
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={pageForward}
                    >{`> `}</span>
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                            changePage(Math.ceil(total / query?.limit))
                        }
                    >{`>|`}</span>
                </div>
            )}
        </div>
    );
};

export default Paging;

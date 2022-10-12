import config from '../../config';

import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';
import { useCallback, useMemo } from 'react';

const Paging = ({ query, pagination, total }) => {
    const refresh = useRefreshRoot();

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

    const totalString = total.toLocaleString(config.locale);
    let showingMessage;
    if (total == 0) {
        showingMessage = 'No matching rows';
    } else if (total == 1) {
        showingMessage = 'Showing 1 matching row';
    } else if (pagination.length > 1) {
        const startRow = ((query?.offset || 0) + 1).toLocaleString(
            config.locale
        );
        const endRow = Math.min(
            (query?.offset || 0) + query?.limit,
            total
        ).toLocaleString(config.locale);
        showingMessage = (
            <>
                Showing{' '}
                <span
                    style={{ fontWeight: '500' }}
                >{`${startRow} - ${endRow}`}</span>{' '}
                rows of {totalString} &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
            </>
        );
    } else {
        showingMessage = `Showing all ${totalString} matching rows`;
    }

    return (
        <div className="pages">
            {showingMessage}
            {pagination.length > 1 && (
                <>
                    Page: &nbsp;
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() => changePage(1)}
                    >{`|<`}</span>{' '}
                    &nbsp;
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={pageBack}
                    >{`<`}</span>
                    <input
                        type="text"
                        onChange={(e) => changePage(e.target.value || 1)}
                        value={currentPage}
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
                    >{`>`}</span>{' '}
                    &nbsp;
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                            changePage(Math.ceil(total / query?.limit))
                        }
                    >{`>|`}</span>
                </>
            )}
        </div>
    );
};

export default Paging;

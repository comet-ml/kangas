import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';

const SortBy = ({ query, children }) => {
    const refresh = useRefreshRoot();
    return (
        <select
            name="Sort"
            id="sort"
            onChange={(e) => {
                refresh({
                    query: {
                        ...query,
                        sortBy: e.target.value,
                        offset: 0,
                    },
                });
            }}
        >
            {children}
        </select>
    );
};

export default SortBy;

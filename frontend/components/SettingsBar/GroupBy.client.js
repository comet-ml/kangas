import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';
import makeQuery from '../../lib/makeQuery';

const GroupBy = ({ query, children }) => {
    const refresh = useRefreshRoot();
    return (
        <select
            name="Group"
            id="group"
            onChange={(e) => {
                refresh({
                    query: makeQuery(query, '', {
                        groupBy: e.target.value,
                        sortBy: e.target.value,
                        limit: 1000000000,
                        offset: 0,
                    }),
                });
            }}
        >
            {children}
        </select>
    );
};

export default GroupBy;

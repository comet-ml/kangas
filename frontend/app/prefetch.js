import config from '../config';

import fetchDataGrid from "../lib/fetchDatagrid";
import fetchDatagrids from "../lib/fetchDatagrids"

const Prefetch = async ({ datagrids, query }) => {
    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? 10;

    if (config.prefetch) {
        // Fetch first page of all available datagrids
        for (const dgid of datagrids) {
            try {
                const temp = await fetchDataGrid({ dgid: dgid.value, timestamp: dgid.timestamp, limit });
            } catch (error) {
                console.log(error);
            }
        }

        // Fetch three pages forward
        for (let x = 1; x < 4; x++) {
            const nextPage = await fetchDataGrid({ ...query, offset: offset + (limit * x)});
        }
    }
    return (
        <div> </div>
    );
}

export default Prefetch;

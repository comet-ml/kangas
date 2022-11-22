import config from '../config';
import Table from './table';

const fetchMatrices = async () => {
    const res = await fetch(`${config.apiUrl}list`)
    return res.json();
}

const fetchDataGrid = async (query) => {
    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    };

    const res = await fetch(`${config.apiUrl}query`, request);
    return res.json()
}

const Page = async ({ searchParams }) => {
    const { 
        dgid='./notebooks/coco-500.datagrid',
        filter,
        groupBy,
        sortBy,
        sortDesc 
    } = searchParams;

    const matrices = await fetchMatrices();
    const data = await fetchDataGrid(searchParams)

    return (
        <div>
            <Table 
                query={{
                    dgid,
                    filter,
                    groupBy,
                    sortBy,
                    sortDesc
                }}
                data={data}
                matrices={matrices}
            />
        </div>
    )
}

export default Page;
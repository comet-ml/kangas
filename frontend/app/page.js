import config from '../config';
import fetchDataGrid from '../lib/fetchDatagrid';
import fetchAvailableMatrices from '../lib/fetchAvailableMatrices';
import Table from './table';

const Page = async ({ searchParams }) => {
    const { 
        dgid='./notebooks/coco-500.datagrid',
        filter,
        groupBy,
        sortBy,
        sortDesc 
    } = searchParams;

    const matrices = await fetchAvailableMatrices();

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
                matrices={matrices}
            />
        </div>
    )
}

export default Page;
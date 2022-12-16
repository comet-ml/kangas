import config from '../config';
import fetchDataGrid from '../lib/fetchDatagrid';
import fetchAvailableMatrices from '../lib/fetchAvailableMatrices';
import Table from './Table/table';
import ButtonBar from './ButtonBar/buttonBar';
import Pager from './Pager/pager';

const Page = async ({ searchParams }) => {
    const {
        dgid='./notebooks/coco-500.datagrid',
        filter,
        groupBy,
        sortBy,
        sortDesc
    } = searchParams;

    return (
        <div>
	    <ButtonBar/>
            <Table
                query={{
                    dgid,
                    whereExpr: filter,
                    groupBy,
                    sortBy,
                    sortDesc
                }}
            />
	    <Pager/>
        </div>
    );
};

export default Page;

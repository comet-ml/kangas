import { Suspense } from 'react';
import dynamic from 'next/dynamic';
// Util
import { useData } from '../../lib/useData';
import fetchTable from '../../lib/fetchTable';
import hashQuery from '../../lib/hashQuery';
// Client Components
import GroupBy from './GroupBy.client';
import MatrixSelect from './MatrixSelect.client';
import SortBy from './SortBy.client';
import FilterExpr from './FilterExpr.client';
import DialogueModal from '../Modals/DialogueModalContainer.client';
import CustomizeColumnsModal from './CustomizeColumns.client';
import { Pages } from '@material-ui/icons';
import Paging from './Paging.client';
import Skeletons from '../skeletons';
import SelectRow from './SelectRow.client';


const SortButton = () => (
    <div className="button-outline">
        <img src="/sort_icon.png" /> <span>Sort</span>
    </div>
);

const GroupButton = () => (
    <div className="button-outline">
        <img src="/group_placeholder.png" /> <span>Group by</span>
    </div>
);

const SelectButton = () => (
    <div className="button-outline">
        <img src="/columns_placeholder.png" /> <span>Columns</span>
    </div>
);

const SettingsBarServer = ({ query, matrices, columns, options }) => {
    return (
        <div id="settings-bar">
            <div id="matrix-select" className="select-row">
                <a href="https://www.github.com/comet-ml/kangas" target="_blank">
                    <div style={{ width: 'auto' }}>
                        <div className="button-outline">
                            <img src="/favicon.png" />
                            <span>Kangas</span>
                        </div>
                    </div>
                </a>
                <MatrixSelect query={query} options={matrices} />
            </div>
            <div id="nav-bar">
                <SelectRow columns={columns} query={query} options={options} />
            </div>
        </div>
    );
};

export default SettingsBarServer;

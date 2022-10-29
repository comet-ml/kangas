import dynamic from 'next/dynamic';
// import PopoverModal from './PopoverModalContainer.client';
// import CustomizeColumnsModal from './CustomizeColumns.client';
import DialogueModal from '../Modals/DialogueModalContainer.client';
import FilterExpr from './FilterExpr.client';

const CustomizeColumnsModal = dynamic(() => import('./CustomizeColumns.client'), {
    ssr: false,
});

const PopoverModal = dynamic(() => import('./PopoverModalContainer.client'), {
    ssr: false
});

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

const SelectRow = ({ columns, query, options }) => {
    return (
        <div className="select-row">
            <PopoverModal toggleElement={<GroupButton />}>
                <CustomizeColumnsModal
                    query={query}
                    subtrees={['groupBy', 'sortBy']}
                    columns={columns}
                />
            </PopoverModal>
            <PopoverModal toggleElement={<SortButton />}>
                <CustomizeColumnsModal
                    query={query}
                    subtree={'sortBy'}
                    columns={columns}
                />
            </PopoverModal>
            <DialogueModal 
                toggleElement={<SelectButton />} 
                sx={{
                    "& .MuiDialog-container": {
                        "& .MuiPaper-root": {
                        width: "100%",
                        maxWidth: "540px",  // Set your width here
                        },
                    },
                }}
            >
                <CustomizeColumnsModal
                    query={query}
                    isMulti={true}
                    columns={columns}
                    defaultOptions={options}
                />
            </DialogueModal>
            <FilterExpr query={query} columns={columns} />
        </div>
    );
};

export default SelectRow;

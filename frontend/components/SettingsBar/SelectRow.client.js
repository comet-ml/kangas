'use client';

import DialogueModal from '../Modals/DialogueModalContainer.client';
import FilterExpr from './FilterExpr.client';
import GroupBy from './GroupBy.client';
import SortBy from './SortBy.client';
import CustomizeColumnsModal from './CustomizeColumns.client';

const SelectButton = () => (
    <div className="button-outline">
        <img src="/columns_placeholder.png" /> <span>Columns</span>
    </div>
);

const SelectRow = ({ columns, query, options, completions }) => {
    return (
        <div className="select-row">
            <GroupBy query={query} columns={columns} />
            <SortBy query={query} columns={columns} />
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
            <FilterExpr query={query} columns={columns} completions={completions} />
        </div>
    );
};

export default SelectRow;

import React, { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic.js';
import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const Select = dynamic(() => import('react-select'), {
    ssr: false,
});

import MultiSelectSort from './MultiSelectSort.client.js';
import makeQuery from '../../lib/makeQuery.js';

const SortArrow = ({ toggle, sortDesc }) => {
    return (
        <div className='arrow-toggle' onClick={toggle}>
            { sortDesc && <KeyboardArrowDownIcon /> }
            { !sortDesc && <KeyboardArrowUpIcon /> }
        </div>
    )
}

const CustomizeColumnsModal = ({
    columns,
    query,
    defaultOptions,
    subtree = '',
    isMulti = false,
    subtrees = [], // Optional: Some buttons might need to update multiple fields (e.g. grouping should also sort)
}) => {
    const refresh = useRefreshRoot();
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [newOptions, setNewOptions] = useState(null);
    // Should the reset button be active
    const [active, setActive] = useState(false);
    const [sortDesc, setSortDesc] = useState(false);

    const CLEAR_CHOICE = { id: 0, label: '', value: null };

    // React select requires an array of dictionaries as input
    const options = useMemo(
        () =>
            columns.map((col, i) => {
                // For dropdown selectors, we add an empty cell at id: 0, hence the i + 1 below
                return { id: i + 1, label: col, value: col };
            }),
        [columns]
    );

    const defaults = useMemo(
        () =>
            defaultOptions?.map((col, i) => {
                // For dropdown selectors, we add an empty cell at id: 0, hence the i + 1 below
                return { id: i + 1, label: col, value: col };
            }),
        [defaultOptions]
    );

    const selectedOption = useMemo(() => {
        const selection = query[subtree] || query[subtrees[0]];
        return options.find((opt) => opt.value === selection) || null;
    }, [options, query]);

    const handleClearCurrentChanges = () => {
        setNewOptions(null);
    };

    const handleColumnToggle = (newSelectedOptions, action) => {
        setNewOptions(newSelectedOptions);
        setMenuIsOpen(false);
    };

    const handleResetDefaultColumns = () => {
        setNewOptions(columns);
    };

    // This is for selecting multiple columns
    const handleUpdateColumns = useCallback(
        (selected) => {
            const parsedOptions = selected.map((col) => col.value);
            refresh({
                query: makeQuery(query, '', { select: parsedOptions }),
            });
        },
        [query]
    );

    // This is for updating a singular column, where we may need to make the update across multiple fields
    const handleUpdateColumn = useCallback(
        (selected) => {
            const column = selected.value;

            // If we've specified multiple subtrees, we need to iterate across them.
            if (subtrees.length) {
                let newQuery = { ...query, sortDesc };
                for (const tree of subtrees) {
                    newQuery = makeQuery(newQuery, tree, column);
                }

                // Shrink limit if we're adding a groupBy; reset to 10 if removing groupBy
                if (newQuery?.groupBy) {
                    const { limit, offset, ...limitless } = newQuery;
                    newQuery = { ...limitless, limit: 4 };
                } else {
                    const { limit, offset, ...limitless } = newQuery;
                    newQuery = { ...limitless, limit: 10 };
                }

                refresh({
                    query: newQuery,
                });
            } else {
                refresh({
                    query: makeQuery(query, subtree, column),
                });
            }
        },
        [subtrees, subtree, query, sortDesc]
    );

    const handleClearColumn = useCallback(() => {
        let newQuery = { ...query };
        if (subtree === 'groupBy' || subtrees[0] == 'groupBy') {
            const { groupBy, sortBy, ...groupless } = newQuery;
            newQuery = {
                ...groupless,
                limit: 10,
            };
        } else if (subtree === 'sortBy' || subtrees[0] == 'sortBy') {
            const { sortBy, ...unsorted } = newQuery;
            newQuery = unsorted;
        }

        refresh({
            query: newQuery,
        });
    }, [query, subtree, subtrees]);

    const toggleDesc = useCallback(() => {
        // This is only passed to the single column selector, so the subtree parsing is unnecessary
        refresh({
            query: {
                ...query,
                sortDesc: !query?.sortDesc
            }
        });

    }, [query])
    
    // FIXME: remove this height: 320px when we find solution for standalone height
    // in select:
    if (isMulti) {
        return (
            <div>
                <div className="alert">
                    You can drag and drop columns to sort them in the DataGrid
                </div>
                <MultiSelectSort
                    options={options}
                    update={handleUpdateColumns}
                    defaults={defaults}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="select-modal-title">
                <div>Select a column { !!query?.sortBy && <SortArrow toggle={toggleDesc} sortDesc={query?.sortDesc} /> }</div>
                <div
                    className={`reset-button ${
                        selectedOption ? 'enabled' : 'disabled'
                    }`}
                    onClick={handleClearColumn}
                >
                    Reset to default
                </div>
            </div>
            <div className="select-modal-body">
                <Select
                    options={options}
                    value={selectedOption}
                    onChange={handleUpdateColumn}

                />
            </div>
        </div>
    );
};

export default CustomizeColumnsModal;

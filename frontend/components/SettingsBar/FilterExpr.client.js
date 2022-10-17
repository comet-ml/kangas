import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { useCallback, useEffect } from 'react';
import DialogueModal from '../Modals/DialogueModalContainer.client';

import HelpText from './HelpText.js';

const FilterButton = ({ callback }) => (
    <div className="button-outline" onClick={callback}>
        <img src="/filter_placeholder.png" /> <span>Filter</span>
    </div>
);

const HelpButton = () => (
    <div className="button-outline">
        <span>?</span>
    </div>
);

const FilterExpr = ({ query }) => {
    const refresh = useRefreshRoot();

    const onKeyPress = useCallback(
	(e) => {
	    if (e.key === 'Enter') {
		refresh({
                    query: {
			...query,
			whereExpr: filter?.value,
			offset: 0,
                    },
		});
	    }
	}, [query]
    );

    const applyFilter = useCallback(
        (e) => {
            const filter = document.getElementById('filter');
            refresh({
                query: {
                    ...query,
                    whereExpr: filter?.value,
                    offset: 0,
                },
            });
        },
        [query]
    );

    useEffect(() => {
        const filter = document.getElementById('filter');
        filter.value = query?.whereExpr || '';
    }, [query]);

    return (
        <>
            <TextField
                placeholder={`e.g.: {"column name"} > 0.5`}
                id="filter"
                sx={{
                    width: '360px'
                }}
                InputProps={{
                    endAdornment: <FilterButton callback={applyFilter} />,
                    sx: {
                        fontSize: '13px'
                    }
                }}
                onKeyPress={onKeyPress}
            />
            <DialogueModal fullScreen={false} width={'50%'} height={'50%'} toggleElement={<HelpButton />}>
                <HelpText />
            </DialogueModal>
        </>
    );
};

export default FilterExpr;

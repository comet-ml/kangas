import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';
import Autocomplete from './ReactAutocomplete';
import { TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { useCallback, useEffect } from 'react';
import DialogueModal from '../Modals/DialogueModalContainer.client';

import HelpText from './HelpText.js';

const HelpButton = () => (
    <div className="button-outline">
        <span>?</span>
    </div>
);

const FilterExpr = ({ query, columns }) => {
    const refresh = useRefreshRoot();

    const onKeyPress = (e) => {
        const filter = document.getElementById('filter');
	if (e.key === 'Enter') {
	    refresh({
                query: {
		    ...query,
		    whereExpr: filter?.value,
		    offset: 0,
                },
	    });
	}
    };

    const applyFilter = (e) => {
        const filter = document.getElementById('filter');
        refresh({
            query: {
                ...query,
                whereExpr: filter?.value,
                offset: 0,
            },
        });
    };

    useEffect(() => {
        const filter = document.getElementById('filter');
        filter.value = query?.whereExpr || '';
    }, [query]);

    return (
        <>
            <Autocomplete
                defaultValue={query?.whereExpr || ''}
                trigger={["{"]} 
                options={{"{": columns.map(name => `"${name}"`)}}
                changeOnSelect={(trigger, slug) => `{${slug}}`}
                matchAny={true}
                regex={'^[a-zA-Z0-9_\\-\\"\\ ]+$'}
                spacer={''}
                maxOptions={0}
                spaceRemovers={['.']}
                placeholder={`e.g.: {"column name"} > 0.5`}
                id="filter"
                onKeyPress={onKeyPress}
                applyFilter={applyFilter}
            />
            <DialogueModal fullScreen={false} toggleElement={<HelpButton />}>
                <HelpText />
            </DialogueModal>
        </>
    );
};

export default FilterExpr;

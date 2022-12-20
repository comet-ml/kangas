import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';
import Autocomplete from './ReactAutocomplete';
import { TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import DialogueModal from '../modals/DialogueModal/DialogueModalClient';

const FilterExpr = ({ query, columns, completions }) => {
    const refresh = useRefreshRoot();
    const filter = useRef();
    const onKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            refresh({
                    query: {
                        ...query,
                        whereExpr: filter?.current?.value,
                        offset: 0,
                    },
            });
        }
    }, [query, refresh]);

    const applyFilter = useCallback((e) => {
        refresh({
            query: {
                ...query,
                whereExpr: filter?.current?.value,
                offset: 0,
            },
        });
    }, [query, refresh]);

    useEffect(() => {
        filter.current.value = query?.whereExpr || '';
    }, [query]);

    const onChangeSelect = useCallback((trigger, slug) => {
	if (trigger === '{') {
	    return `{${slug}}`;
	} else if (trigger.endsWith('.')) {
	    return `${trigger}${slug}`;
	} else {
	    return ` ${slug}`;
	}
    }, [query, refresh]);

    const triggers = useMemo(() => {
	return ["{"].concat(Object.keys(completions));
    }, [completions]);

    const options = useMemo(() => {
	return {
	    "{": columns.map(name => `"${name}"`),
	    ...completions,
	};
    }, [completions, columns]);

    return (
        <>
            <Autocomplete
                defaultValue={query?.whereExpr || ''}
                trigger={triggers}
                options={options}
                changeOnSelect={onChangeSelect}
                matchAny={true}
                regex={'^[a-zA-Z0-9_\\-\\"\\ ]+$'}
                spacer={''}
                maxOptions={0}
                spaceRemovers={['.']}
                placeholder={`e.g.: {"column name"} > 0.5`}
                id="filter"
                onKeyPress={onKeyPress}
                applyFilter={applyFilter}
                refInput={filter}
            />
        </>
    );
};

export default FilterExpr;

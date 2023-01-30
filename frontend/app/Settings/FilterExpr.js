'use client';

import Autocomplete from './ReactAutoComplete';
import { TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';

const FilterExpr = ({ query, completions }) => {
    const { params, updateParams } = useQueryParams();
    const filter = useRef();

    const getValue = (value) => {
        if (typeof(value) === 'undefined' || value === '')
            return undefined;
        return value;
    };

    const onKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            updateParams({
                filter: getValue(filter?.current?.value),
                page: undefined,
            });
        }
    }, [updateParams]);

    const clearFilter = useCallback((event) => {
        updateParams({
            filter: undefined,
            page: undefined,
        });
    }, [updateParams]);

    useEffect(() => {
        if (typeof(filter?.current?.value) !== "undefined")
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
    }, [query]);

    const triggers = useMemo(() => {
        if (!completions) return ["{"];
        
        return ["{"].concat(Object.keys(completions));
    }, [completions]);

    return (
        <>
            <Autocomplete
                defaultValue={query?.whereExpr || ''}
                trigger={triggers}
                options={completions}
                changeOnSelect={onChangeSelect}
                matchAny={true}
                regex={'^[a-zA-Z0-9_\\-\\"]+$'}
                spacer={''}
                maxOptions={0}
                spaceRemovers={['.']}
                placeholder={`e.g.: {"column name"} > 0.5`}
                id="filter"
                onKeyPress={onKeyPress}
                clearFilter={clearFilter}
                refInput={filter}
            />
        </>
    );
};

export default FilterExpr;

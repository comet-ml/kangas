'use client';

import Autocomplete from './ReactAutoComplete';
import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';
import styles from './Filter.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const FilterExpr = ({ query, completions }) => {
    const { params, updateParams } = useQueryParams();
    const filterRef = useRef();
    const timeout = useRef();
    const [status, setStatus] = useState();

    const fetchValidity = useCallback((filter) => {
        setStatus('LOADING');

        fetch(`/api/filter?dgid=${params?.datagrid}&timestamp=${query?.timestamp}&where=${filter}`, { next: { revalidate: 10000 }})
        .then(res => res.json())
        .then(data => {
            if (data?.valid) {
                setStatus('VALID');
            } else {
                setStatus('INVALID');
            }
        });
    }, [params]);

    // Debounce call to verify-filter so that we don't spam the endpoint
    const onChange = useCallback((filter) => {
        if (status !== 'LOADING') {
            try {
                clearTimeout(timeout.current)
            } catch {

            } finally {
                timeout.current = setTimeout(() => fetchValidity(filter), 150)
            }
        }
    }, [fetchValidity, status]);

    const getValue = (value) => {
        if (typeof(value) === 'undefined' || value === '')
            return undefined;
        return value;
    };

    const onKeyPress = useCallback((e) => {
        // Only fire if filter is valid
        if (e.key === 'Enter' && status === 'VALID') {
            updateParams({
                filter: getValue(filterRef?.current?.value),
                page: undefined,
            });
        }
    }, [updateParams, status]);

    const clearFilter = useCallback((event) => {
        updateParams({
            filter: undefined,
            page: undefined,
        });
    }, [updateParams]);

    useEffect(() => {
        if (typeof(filterRef?.current?.value) !== "undefined")
            filterRef.current.value = query?.whereExpr || '';
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

    // Underline text when filter is invalid
    useEffect(() => {
        if (status === 'INVALID') {
            filterRef?.current?.classList?.add(cx('invalid'));
        } else {
            filterRef?.current?.classList?.remove(cx('invalid'));
        }
    }, [status]);

    return (
        <div className={cx('filter-bar')}>
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
                refInput={filterRef}
                onChange={onChange}
            />
        </div>
    );
};

export default FilterExpr;

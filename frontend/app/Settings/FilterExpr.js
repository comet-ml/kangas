'use client';

import Autocomplete from './ReactAutoComplete';
import { useCallback, useEffect, useRef, useMemo, useState, useContext } from 'react';
import useQueryParams from '@kangas/lib/hooks/useQueryParams';
import formatQueryArgs from '@kangas/lib/formatQueryArgs';
import styles from './Filter.module.scss';
import classNames from 'classnames/bind';
import { ConfigContext } from "@kangas/app/contexts/ConfigContext";

const cx = classNames.bind(styles);

const FilterExpr = ({ query, completions }) => {
    const { config } = useContext(ConfigContext);
    const { params, updateParams } = useQueryParams();
    const filterRef = useRef();
    const timeout = useRef();
    const [status, setStatus] = useState();
    const [filterText, setFilterText] = useState(query?.whereExpr || '');

    // If the filter is cleared in the refresh button:
    useEffect(() => {
        if (typeof query?.whereExpr === "undefined" && filterText != '') {
            setFilterText('');
        }
    }, [query?.whereExpr]);

    const fetchValidity = useCallback((filter) => {
        setStatus('LOADING');

        const queryString = formatQueryArgs({
            dgid: params?.datagrid,
            timestamp: query?.timestamp,
            where: filter,
            computedColumns: query?.computedColumns,
        });

        fetch(`${config.rootPath}api/filter?${queryString}`, { next: { revalidate: 10000 }})
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
        setFilterText(filter);
        try {
            clearTimeout(timeout.current)
        } catch {

        } finally {
            timeout.current = setTimeout(() => fetchValidity(filter), 150)
        }
    }, [fetchValidity]);

    const getValue = (value) => {
        if (typeof(value) === 'undefined' || value === '') return undefined;
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
        setFilterText('');
        updateParams({
            filter: undefined,
            page: undefined,
        });
    }, [updateParams]);

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
                value={filterText}
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

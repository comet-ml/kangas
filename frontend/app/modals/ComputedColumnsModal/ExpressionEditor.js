'use client';

import Autocomplete from '@kangas/app/Settings/ReactAutoComplete';
import { useCallback, useEffect, useRef, useMemo, useState, useContext } from 'react';
import useQueryParams from '@kangas/lib/hooks/useQueryParams';
import formatQueryArgs from '@kangas/lib/formatQueryArgs';
import styles from './ExpressionEditor.module.scss';
import classNames from 'classnames/bind';
import { ConfigContext } from "@kangas/app/contexts/ConfigContext";
import { ViewContext } from '@kangas/app/contexts/ViewContext';

const cx = classNames.bind(styles);

const ExpressionEditor = ({ 
    style, 
    expression, 
    completions,             
    computedColumns, 
    onChange 
}) => {
    const { config } = useContext(ConfigContext);
    const { params, updateParams } = useQueryParams();
    const { query } = useContext(ViewContext);
    const expressionRef = useRef();
    const timeout = useRef();
    const [status, setStatus] = useState();

    const fetchValidity = useCallback((text) => {
        setStatus('LOADING');

        const queryString = formatQueryArgs({
            dgid: params?.datagrid,
            timestamp: query?.timestamp,
            where: text,
            computedColumns: computedColumns,
        });

        fetch(`${config.rootPath}api/filter?${queryString}`, { next: { revalidate: 10000 }})
        .then(res => res.json())
        .then(data => {
            if (data?.valid) {
                setStatus('VALID');
            } else {
                setStatus('INVALID');
            }
            // FIXME? set the field regardless of validity
            onChange({target: {value: text}});
        });
    }, [params, query]);

    // Debounce call to verify-filter so that we don't spam the endpoint
    const editorOnChange = useCallback((text) => {
        if (status !== 'LOADING') {
            try {
                clearTimeout(timeout.current)
            } catch {

            } finally {
                timeout.current = setTimeout(() => fetchValidity(text), 150)
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
                filter: getValue(expressionRef?.current?.value),
                page: undefined,
            });
        }
    }, [updateParams, status]);

    useEffect(() => {
        if (typeof(expressionRef?.current?.value) !== "undefined")
            expressionRef.current.value = expression;
    }, [params]);

    const onChangeSelect = useCallback((trigger, slug) => {
        if (trigger === '{') {
            return `{${slug}}`;
        } else if (trigger.endsWith('.')) {
            return `${trigger}${slug}`;
        } else {
            return ` ${slug}`;
        }
    }, [params]);

    const triggers = useMemo(() => {
        if (!completions) return ["{"];

        return ["{"].concat(Object.keys(completions));
    }, [completions]);

    // Underline text when filter is invalid
    useEffect(() => {
        if (status === 'INVALID') {
            expressionRef?.current?.classList?.add(cx('invalid'));
        } else {
            expressionRef?.current?.classList?.remove(cx('invalid'));
        }
    }, [status]);

    return (
        <div className={cx('filter-bar')} style={style}>
            <Autocomplete
                defaultValue={expression}
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
                refInput={expressionRef}
                onChange={editorOnChange}
                adornment={false}
                inputProps={{
                    spellCheck: false,
                    style: {width: '375px', height: '5px' }
                }}
            />
        </div>
    );
};

export default ExpressionEditor;

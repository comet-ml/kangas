'use client';

import Autocomplete from '../../Settings/ReactAutoComplete';
import { useCallback, useEffect, useRef, useMemo, useState, useContext } from 'react';
import useQueryParams from '../../../lib/hooks/useQueryParams';
import formatQueryArgs from '../../../lib/formatQueryArgs';
import styles from './ExpressionEditor.module.scss';
import classNames from 'classnames/bind';
import { ConfigContext } from "../../contexts/ConfigContext";

const cx = classNames.bind(styles);

const ExpressionEditor = ({ key, className, style, expression, completions,
                            computedColumns, onChange }) => {
    const { config } = useContext(ConfigContext);
    const { params, updateParams } = useQueryParams();
    const expressionRef = useRef();
    const timeout = useRef();
    const [status, setStatus] = useState();

    const fetchValidity = useCallback((text) => {
        setStatus('LOADING');

        const queryString = formatQueryArgs({
            dgid: params?.datagrid,
            timestamp: params?.timestamp,
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
    }, [params]);

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
        <div className={cx('filter-bar')}>
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
                    spellcheck: false,
                    style: { height: '5px' }
                }}
            />
        </div>
    );
};

export default ExpressionEditor;

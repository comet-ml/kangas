'use client';

import React, { useRef, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModalContext } from '../../contexts/ModalContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';
import formatQueryArgs from '../../../lib/formatQueryArgs';
import { ConfigContext } from "../../contexts/ConfigContext";

import classNames from 'classnames/bind';
import styles from '../../Settings/SettingsBar.module.scss';
const cx = classNames.bind(styles);

const ComputedColumnsModal = ({ columns, query, completions }) => {
    const { config } = useContext(ConfigContext);
    const { params, updateParams } = useQueryParams();
    const { closeModal } = useContext(ModalContext);
    const status = useRef();

    const defaultText = `{
    "New Column Name": {
        "expr": "{'row-id'} < 5",
        "type": "BOOLEAN"
    }
}`;
    const [text, setText] = useState('');
    const [origJSON, setOrigJSON] = useState({});

    const setStatus = useCallback((newStatus) => {
	console.log(status);
	if (status?.current)
	    status.current.value = newStatus;
    }, [status]);

    useEffect(() => {
        if (!!query?.computedColumns) {
            setText(JSON.stringify(query.computedColumns, null, 4));
            setOrigJSON(query.computedColumns);
	}
    }, [query?.computedColumns]);

    const reset = useCallback(() => {
        setText(defaultText);
	setStatus('');
    }, [setText, status]);

    const clear = useCallback(() => {
        setText('');
	setStatus('');
    }, [setText, status]);

    const onChange = useCallback((event) => {
        setText(event.target.value);
	setStatus('Edited');
    }, [setText, status]);

    const apply = useCallback((close=false) => {
        let realJSON = null;
        let textJSON = null;
        if (text !== '') {
            try {
		realJSON = JSON.parse(text);
                textJSON = JSON.stringify(realJSON).replace(/\\n/g, '');
            } catch (error) {
                console.log(`invalid json: ${text}`);
		setStatus('Invalid JSON');
                return;
            }
        } else {
	    realJSON = {};
            textJSON = undefined;
        }
	// Verify that this works, with (or without) filter:
        const queryString = formatQueryArgs({
	    dgid: query?.dgid,
	    timestamp: query?.timestamp,
	    where: query?.whereExpr,
	    computedColumns: realJSON,
        });
        fetch(`${config.rootPath}api/filter?${queryString}`,
	      { next: { revalidate: 10000 }})
	    .then(res => res.json())
	    .then(data => {
		if (data?.valid) {
		    const myParams = {
			cc: textJSON
		    };
		    if ((params.group in origJSON) && !(params.group in realJSON)) {
			myParams.group = undefined;
			myParams.page = undefined;
			myParams.rows = undefined;
		    }
		    if ((params.sort in origJSON) && !(params.sort in realJSON)) {
			myParams.sort = undefined;
		    }
		    updateParams(myParams);
		    if (close)
			closeModal();
		    else
			setStatus('Successfully applied');
		} else {
		    setStatus('Remove filter before changing computed columns');
		    console.log(`failed to fetch with filter: ${text}`);
		}
	    });
    }, [text, updateParams, params, closeModal, status]);

    return (
            <div className={cx("multi-select-columns")}>
                <div className={cx("title")}>
                    Computed Columns
                </div>
                <div className={cx("subtitle")}>
                    Add computed columns to the table
                </div>
                <div className={cx("multi-select-columns-body")}>
                    <textarea
                        className={cx("computed-column-textarea")}
                        name="computedColumnsTextarea"
                        spellCheck={"false"}
                        value={text}
                        onChange={onChange}
                        rows={23}
                        cols={50}
                    />
	            <div className={cx("status-row")}><b>Status</b>: <input className={cx("status-message")} readOnly type="text" ref={status} /></div>
                    <div className={cx("button-row")}>
                        <div className={cx("reset")} onClick={reset}>Template</div>
                        <div className={cx("reset")} onClick={clear}>Clear</div>
                        <button className={cx('button-outline')} onClick={() => apply(false)}>Apply</button>
                        <button className={cx('button')} onClick={() => apply(true)}>Done</button>
                    </div>
                </div>
            </div>
    );
};

export default ComputedColumnsModal;

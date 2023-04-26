'use client';

import React, { useRef, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModalContext } from '../../contexts/ModalContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';
import formatQueryArgs from '../../../lib/formatQueryArgs';
import { ConfigContext } from "../../contexts/ConfigContext";
import ComputedColumnsEditor from './ComputedColumnsEditor';

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
	if (status?.current)
	    status.current.value = newStatus;
    }, [status]);

    useEffect(() => {
        if (!!query?.computedColumns) {
            setText(JSON.stringify(query.computedColumns, null, 4));
            setOrigJSON(query.computedColumns);
	    setStatus('Unedited');
	}
    }, [query?.computedColumns, setText, setOrigJSON, setStatus]);

    const reset = useCallback(() => {
        setText(defaultText);
	setStatus('Set to sample template');
    }, [setText, setStatus]);

    const clear = useCallback(() => {
        setText('');
	setStatus('Cleared');
    }, [setText, setStatus]);

    const onChange = useCallback((value) => {
	//FIXME: currently cause a loop
        //setText(value);
	setStatus('Edited');
    }, [setText, setStatus]);

    const apply = useCallback((close=false) => {
        let realJSON = null;
        let textJSON = null;
        if (text !== '') {
            try {
		realJSON = JSON.parse(text);
                textJSON = JSON.stringify(realJSON).replace(/\\n/g, '');
            } catch (error) {
		setStatus('Invalid JSON syntax (trailing comma?)');
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
		    if (!textJSON) {
			setStatus('Error: filter depends on computed columns; remove it');
		    } else if (typeof query?.whereExpr === 'undefined') {
			setStatus('Error: fix JSON syntax above (trailing comma?)');
		    } else {
			setStatus('Error: fix JSON syntax above, or remove filter dependency');
		    }
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
                    <ComputedColumnsEditor
                        className={cx("computed-column-textarea")}
                        name="computedColumnsTextarea"
                        value={text}
                        onChange={onChange}
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

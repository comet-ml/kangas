'use client';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModalContext } from '../../contexts/ModalContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';

import classNames from 'classnames/bind';
import styles from '../../Settings/SettingsBar.module.scss';
const cx = classNames.bind(styles);

const ComputedColumnsModal = ({ columns, query, completions }) => {
    const { params, updateParams } = useQueryParams();
    const { closeModal } = useContext(ModalContext);
    const defaultText = `{
    "New Column Name": {
        "expr": "{'row-id'} < 5",
        "type": "BOOLEAN"
    }
}`;
    const [text, setText] = useState('');
    const [origJSON, setOrigJSON] = useState({});

    useEffect(() => {
        if (!!query?.computedColumns) {
            setText(JSON.stringify(query.computedColumns, null, 4));
            setOrigJSON(query.computedColumns);
	}
    }, [query?.computedColumns]);

    const reset = useCallback(() => {
        setText(defaultText);
    }, [setText]);

    const clear = useCallback(() => {
        setText('');
    }, [setText]);

    const onChange = useCallback((event) => {
        setText(event.target.value);
    }, [setText]);

    const apply = useCallback(() => {
        let realJSON = null;
        let textJSON = null;
        if (text !== '') {
            try {
		realJSON = JSON.parse(text);
                textJSON = JSON.stringify(realJSON).replace(/\\n/g, '');
            } catch (error) {
                console.log(`invalid json: ${text}`);
                return false;
            }
        } else {
	    realJSON = {};
            textJSON = undefined;
        }
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
	return true;
    }, [text, updateParams]);

    const update = useCallback(() => {
	const result = apply();
	if (result)
            closeModal();
    }, [text, updateParams, closeModal]);

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
                        rows={25}
                        cols={50}
                    />
                    <div className={cx("button-row")}>
                        <div className={cx("reset")} onClick={reset}>Template</div>
                        <div className={cx("reset")} onClick={clear}>Clear</div>
                        <button className={cx('button-outline')} onClick={apply}>Apply</button>
                        <button className={cx('button')} onClick={update}>Done</button>
                    </div>
                </div>
            </div>
    );
};

export default ComputedColumnsModal;

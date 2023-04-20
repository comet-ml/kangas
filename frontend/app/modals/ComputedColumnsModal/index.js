'use client';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModalContext } from '../../contexts/ModalContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';

import classNames from 'classnames/bind';
import styles from '../../Settings/SettingsBar.module.scss';
const cx = classNames.bind(styles);

const ComputedColumnsModal = ({ query, completions }) => {
    const { params, updateParams } = useQueryParams();
    const { closeModal } = useContext(ModalContext);
    const defaultText = `{
    "New Column Name": {
        "expr": "{'row-id'} < 5",
        "type": "BOOLEAN"
    }
}`;
    const [text, setText] = useState('');

    useEffect(() => {
        if (!!query?.computedColumns)
            setText(JSON.stringify(query?.computedColumns, null, 4));
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
        let textJSON = null;
        if (text !== '') {
            try {
                textJSON = JSON.stringify(JSON.parse(text)).replace(/\\n/g, '');
            } catch (error) {
                console.log(`invalid json: ${text}`);
                return;
            }
        } else {
            textJSON = undefined;
        }
        updateParams({
            cc: textJSON
        });
    }, [text, updateParams, closeModal]);

    const update = useCallback(() => {
        let textJSON = null;
        if (text !== '') {
            try {
                textJSON = JSON.stringify(JSON.parse(text)).replace(/\\n/g, '');
            } catch (error) {
                console.log(`invalid json: ${text}`);
                return;
            }
        } else {
            textJSON = undefined;
        }

        updateParams({
            cc: textJSON
        });
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
                        <button className={cx('button')} onClick={apply}>Apply</button>
                        <button className={cx('button')} onClick={update}>Done</button>
                    </div>
                </div>
            </div>
    );
};

export default ComputedColumnsModal;

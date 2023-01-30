'use client';

import { useCallback, useContext, useMemo, useState } from 'react';
import Select from 'react-select';
import { ViewContext } from '../../contexts/ViewContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import styles from './SelectColumnDropdown.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

import "./Mui.css";

const SortArrow = ({ toggle, sortDesc }) => {
    return (
        <div className={cx('arrow-toggle')} onClick={toggle}>
            { sortDesc && <KeyboardArrowDownIcon /> }
            { !sortDesc && <KeyboardArrowUpIcon /> }
        </div>
    );
}

const SelectColumnDropdown = ({ toggleOpen, group = false }) => {
    const { params, updateParams } = useQueryParams();
    const { columns } = useContext(ViewContext);
    const [selected, setSelected] = useState();

    const toggleDesc = useCallback(() => {
        updateParams({
            descending: (params?.descending !== 'true').toString()
        });
    }, [params, updateParams]);


    const cancelSelection = useCallback(() => {
        setSelected(null);
        toggleOpen();
    }, [toggleOpen]);

    const commitChange = useCallback((e) => {
        if (!selected) return;

        if (group) {
            updateParams({
                group: selected[0].value,
                sort: selected[0].value,
                rows: 4,
                page: undefined,
            });    
        } else {
            updateParams({
                sort: selected[0].value
            });    
        }
        toggleOpen();
    }, [group, selected, updateParams, toggleOpen])

    const resetDefault = useCallback(() => {
        if (group) {
            updateParams({
                group: undefined,
                page: undefined,
                rows: undefined,
            });
        } else {
            updateParams({
                sort: undefined,
            });
        }
        toggleOpen();
    });

    // React select requires an array of dictionaries as input
    const options = useMemo(
        () =>
            Object.keys(columns).map((col, i) => {
                // For dropdown selectors, we add an empty cell at id: 0, hence the i + 1 below
                return { id: i + 1, label: col, value: col };
            }),
        [columns]
    );

    const updateSelected = useCallback((e) => {
        setSelected(options?.filter((o) => o.value === e.value));
    }, [options]);


    return (
        <div>
            <div className={cx('select-modal-title')}>
                <div>Select a column</div>
                <div
                    className={cx('reset-button')}
                    onClick={resetDefault}
                 >
                    Reset to default
                 </div>
            </div>
            <div className={cx('select-modal-body')}>
            <div className={cx('react-select-container')}>
                <Select
                    value={selected ?? options.filter(e => e.label === (group ? params?.group : params?.sort))}
                    options={options}
                    onChange={updateSelected}

                />
                { !group && <SortArrow toggle={toggleDesc} sortDesc={params?.descending === 'true'} /> }
              </div>
              <div className={cx('button-row-footer')}>
                <div className={cx('button-outline')} onClick={cancelSelection}>
                    Cancel
                </div>
                <div className={cx('button')} onClick={commitChange}>
                    Done
                </div>
              </div>
            </div>
        </div>

    )

}

export default SelectColumnDropdown;

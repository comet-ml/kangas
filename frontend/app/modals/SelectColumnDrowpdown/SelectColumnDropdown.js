'use client';

import { useCallback, useContext, useMemo } from 'react';
import Select from 'react-select';
import { ViewContext } from '../../contexts/ViewContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import styles from './SelectColumnDropdown.module.scss';
import styles2 from '../../Settings/SettingsBar.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);
const cx2 = classNames.bind(styles2);

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

    const toggleDesc = useCallback(() => {
        updateParams({
            descending: (params?.descending !== 'true').toString()
        });
    }, [params, updateParams]);

    const groupBy = useCallback((e) => {
        updateParams({
            group: e.value,
            sort: e.value,
            page: undefined,
        });
        toggleOpen();
    }, [updateParams, toggleOpen]);

    const sortBy = useCallback((e) => {
        updateParams({
            sort: e.value
        });
        toggleOpen();
    }, [updateParams, toggleOpen]);

    const resetDefault = useCallback(() => {
        if (group) {
            updateParams({
                group: undefined,
                page: undefined,
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

    return (
        <div>
            <div className={cx('select-modal-title')}>
                <div>Select a column</div>
            </div>
            <div className={cx('select-modal-body')}>
            <div style={{display: 'flex'}}>
                <Select
                    value={options.filter(e => e.label === (group ? params?.group : params?.sort))}
                    options={options}
                    onChange={group ? groupBy : sortBy}

                />
                { !group && <SortArrow toggle={toggleDesc} sortDesc={params?.descending === 'true'} /> }
              </div>
              <div style={{display: 'flex', margin: '20px 0px'}}>
                 <div
                    className={`${cx('reset-button')} ${
                        false ? 'enabled' : 'disabled'
                    }`}
                    onClick={resetDefault}
                 >
                 Reset to default
                 </div>
                 <button className={cx2('button')} onClick={toggleOpen}>Done</button>
              </div>
            </div>
        </div>

    )

}

export default SelectColumnDropdown;

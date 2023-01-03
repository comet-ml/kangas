//import CustomizeColumnsModal from './CustomizeColumnsModal';
// FIXME: has a useRef:
//import usePopover from '../../lib/usePopover';
'use client';

import { Popover } from '@mui/material';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import { useContext } from 'react';
import { ViewContext } from '../../contexts/ViewContext';
import CustomizeColumnsModal from '../CustomizeColumnsModal';
import usePopover from '../../../lib/hooks/usePopover';

const cx = classNames.bind(styles);

const GroupByButton = ({ query }) => {
    const { open, toggleOpen, anchor } = usePopover();
    const { columns } = useContext(ViewContext)
    console.log(columns)
    return (
        <>
            <div className={cx('button-outline', { 'active-button': false })} onClick={toggleOpen} ref={anchor}>
                <img src="/group_placeholder.png" /> <span>Group by</span>
            </div>
            <Popover
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                className={'popover-select'}
                open={open}
            >
                <CustomizeColumnsModal
                    query={query}
                    subtrees={['groupBy', 'sortBy']}
                    columns={columns}
                />
            </Popover>
        </>
    );
};

export default GroupByButton;

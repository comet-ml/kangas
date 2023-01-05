//import CustomizeColumnsModal from './CustomizeColumnsModal';
// FIXME: has a useRef:
//import usePopover from '../../lib/usePopover';
'use client';

import { Popover } from '@mui/material';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import usePopover from '../../../lib/hooks/usePopover';
import SelectColumnDropdown from '../../modals/SelectColumnDrowpdown/SelectColumnDropdown';
const cx = classNames.bind(styles);

const GroupByButton = ({ }) => {
    const { open, toggleOpen, anchor } = usePopover();
    return (
        <>
            <div className={cx('button-outline')} onClick={toggleOpen} ref={anchor}>
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
                anchorEl={anchor?.current}
            >
                <SelectColumnDropdown toggleOpen={toggleOpen} />
            </Popover>
        </>
    );
};

export default GroupByButton;

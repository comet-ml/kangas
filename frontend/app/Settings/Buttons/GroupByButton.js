'use client';

import { Popover } from '@mui/material';
import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import usePopover from '@kangas/lib/hooks/usePopover';
import SelectColumnDropdown from '@kangas/app/modals/SelectColumnDrowpdown/SelectColumnDropdown';
const cx = classNames.bind(styles);

const GroupByButton = ({ columns }) => {
    const { open, toggleOpen, anchor } = usePopover();
    return (
        <>
            <div className={cx('button-outline')} onClick={toggleOpen} ref={anchor}>
                <img src="/kangas_images/group_placeholder.png" /> <span>Group by</span>
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
                onClose={toggleOpen}
                anchorEl={anchor?.current}
            >
                <SelectColumnDropdown columns={columns} toggleOpen={toggleOpen} group={true} />
            </Popover>
        </>
    );
};

export default GroupByButton;

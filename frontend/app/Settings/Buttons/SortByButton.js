'use client';

import { Popover } from '@mui/material';
import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import usePopover from '@kangas/lib/hooks/usePopover';
import SelectColumnDropdown from '@kangas/app/modals/SelectColumnDrowpdown/SelectColumnDropdown';
const cx = classNames.bind(styles);

const SortByButton = ({columns}) => {
    const { open, toggleOpen, anchor } = usePopover();
    return (
        <>
            <div className={cx('button-outline')} onClick={toggleOpen} ref={anchor}>
                <img src="/kangas_images/sort_icon.png" /> <span>Sort By</span>
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
                onClose={toggleOpen}
                open={open}
                anchorEl={anchor?.current}
            >
                <SelectColumnDropdown columns={columns} toggleOpen={toggleOpen} />
            </Popover>
        </>
    );
};

export default SortByButton;

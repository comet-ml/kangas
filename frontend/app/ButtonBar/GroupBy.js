//import CustomizeColumnsModal from './CustomizeColumnsModal';
// FIXME: has a useRef:
//import usePopover from '../../lib/usePopover';
import { Popover } from '@mui/material';

import styles from './ButtonBar.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const GroupButton = ({ active }) => (
    <div className={`${cx('button-outline')} ${active && 'active-button'}`}>
        <img src="/group_placeholder.png" /> <span>Group by</span>
    </div>
);

const GroupBy = ({ query, columns }) => {
    //const { open, toggleOpen, anchor } = usePopover();
    return (
        <>
            <div onClick={toggleOpen} ref={anchor}>
                <GroupButton active={open} />
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
            >
	    {/*
                <CustomizeColumnsModal
                    query={query}
                    subtrees={['groupBy', 'sortBy']}
                    columns={columns}
                    onColumnChange={toggleOpen}
                />
*/}
            </Popover>
        </>
    );
};

export default GroupBy;

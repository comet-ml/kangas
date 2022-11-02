import CustomizeColumnsModal from './CustomizeColumns.client';
import usePopover from '../../lib/usePopover';
import { Popover } from '@mui/material';

const GroupButton = ({ active }) => (
    <div className={`button-outline ${active && 'active-button'}`}>
        <img src="/group_placeholder.png" /> <span>Group by</span>
    </div>
);

const GroupBy = ({ query, columns }) => {
    const { open, toggleOpen, anchor } = usePopover();
    return (
        <>
            <div onClick={toggleOpen} ref={anchor}>
                <GroupButton active={open} />
            </div>
            <Popover
                open={open}
                onClose={toggleOpen}
                anchorEl={anchor.current}
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
                <CustomizeColumnsModal
                    query={query}
                    subtrees={['groupBy', 'sortBy']}
                    columns={columns}
                    onColumnChange={toggleOpen}
                />
            </Popover>            
        </>
    );
};

export default GroupBy;
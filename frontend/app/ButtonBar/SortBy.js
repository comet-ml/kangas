import CustomizeColumnsModal from './CustomizeColumns.client';
import usePopover from '../../lib/usePopover';
import { Popover } from '@mui/material';

const SortButton = ({ active }) => (
    <div className={`button-outline ${active && 'active-button'}`}>
        <img src="/sort_icon.png" /> <span>Sort</span>
    </div>
);

const SortBy = ({ query, columns }) => {
    const { open, toggleOpen, anchor } = usePopover();
    return (
        <>
            <div onClick={toggleOpen} ref={anchor}>
                <SortButton active={open} />
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
                    subtree={'sortBy'}
                    columns={columns}
                    onColumnChange={toggleOpen}
                />
            </Popover>
        </>
    );
};

export default SortBy;

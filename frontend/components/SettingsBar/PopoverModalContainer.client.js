import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';


const Popover = dynamic(() => import('@mui/material/Popover'), {
    ssr: false,
});

const ModalContainer = ({ toggleElement, children }) => {
    const [open, setOpen] = useState(false);
    const anchor = useRef(null);
    const toggleOpen = useCallback(() => {
        if (anchor.current) {
            anchor.current.setAttribute(
                'class',
                `${toggleElement.class} ${!open ? 'active' : ''}`
            );
        }
        setOpen(!open);
    }, [open]);

    return (
        <>
            <div onClick={toggleOpen} ref={anchor}>
                {toggleElement}
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
                {children}
            </Popover>
        </>
    );
};

export default ModalContainer;

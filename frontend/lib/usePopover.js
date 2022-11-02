import { useState, useRef, useCallback } from 'react';

const usePopover = (modalClass) => {
    const [open, setOpen] = useState(false);
    const anchor = useRef(null);
    const toggleOpen = useCallback(() => {
        if (anchor.current) {
            anchor.current.setAttribute(
                'class',
                `${modalClass} ${!open ? 'active' : ''}`
            );
        }
        setOpen(!open);
    }, [open]);

    return { open, toggleOpen, anchor };
}

export default usePopover;
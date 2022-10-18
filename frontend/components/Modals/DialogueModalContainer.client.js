import { useState, useCallback } from 'react';
/*
const Dialogue = dynamic(() => import('@mui/material/Dialog'), {
    ssr: false
});*/

import Dialogue from '@mui/material/Dialog';

const DialogueModalContainer = ({ toggleElement, children, sx, tabIndex, fullScreen = false }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = useCallback(() => setOpen(!open), [open]);
    const openModal = useCallback(() => {
        if (!open) setOpen(true);
    }, [open]);

    if (!toggleElement) {
        return (
            <div
                onClick={openModal}
                style={{
                    height: '100%',
                    width: '100%',
                    opacity: '0',
                    cursor: 'pointer',
                }}
                tabIndex={tabIndex}
            >
                <Dialogue  open={open} fullScreen={fullScreen} onClose={toggleOpen} sx={sx}>
                    {children}
                </Dialogue>
            </div>
        );
    }
    return (
        <>
            <div tabIndex={tabIndex} onClick={openModal}>{toggleElement}</div>
            <Dialogue open={open} fullScreen={fullScreen} onClose={toggleOpen} sx={sx}>
                {children}
            </Dialogue>
        </>
    );
};

export default DialogueModalContainer;

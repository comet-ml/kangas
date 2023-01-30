'use client'

import { useState, useCallback } from 'react';
import Dialogue from '@mui/material/Dialog';
import classNames from 'classnames/bind';
import styles from './DialogueModal.module.scss';

const cx = classNames.bind(styles);


const DialogueModalContainer = ({ toggleElement, children, sx, tabIndex, fullScreen = false }) => {
    const [open, setOpen] = useState(false);
    const closeModal = useCallback(() => setOpen(false), []);
    const openModal = useCallback(() => setOpen(true), []);

    if (!toggleElement) {
        return (
            <div
                onClick={openModal}
                tabIndex={tabIndex}
                className={cx(['dialogue-toggle', 'overlay'])}
            >
                <ModalContext.Provider value={{ expanded: open }}>
                    <Dialogue className={cx('dialogue')} open={open} fullScreen={fullScreen} onClose={closeModal} sx={sx}>
                        {children}
                    </Dialogue>
                </ModalContext.Provider>
            </div>
        );
    }
    return (
        <>
            <div className={cx('dialogue-toggle')} tabIndex={tabIndex} onClick={openModal}>{toggleElement}</div>
            <Dialogue className={cx('dialogue')} open={open} fullScreen={fullScreen} onClose={closeModal} sx={sx}>
                {children}
            </Dialogue>
        </>
    );
};

export default DialogueModalContainer;
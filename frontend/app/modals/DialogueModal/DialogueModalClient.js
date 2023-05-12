'use client'

import { useContext } from 'react';

import Dialogue from '@mui/material/Dialog';
import classNames from 'classnames/bind';
import styles from './DialogueModal.module.scss';
import { ModalContext } from '@kangas/app/contexts/ModalContext';
const cx = classNames.bind(styles);

const DialogueModal = ({
    open,
    toggleElement, 
    children, 
    sx, 
    tabIndex, 
    fullScreen = false 
}) => {
    const { openModal, closeModal } = useContext(ModalContext);

    if (!toggleElement) {
        return (
            <div
                onClick={openModal}
                tabIndex={tabIndex}
                className={cx(['dialogue-toggle', 'overlay'])}
            >
                    <Dialogue className={cx('dialogue')} open={open} fullScreen={fullScreen} onClose={closeModal} sx={sx}>
                        {children}
                    </Dialogue>
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

export default DialogueModal;
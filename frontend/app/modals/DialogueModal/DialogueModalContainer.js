'use client'

import { useState, useCallback, useContext } from 'react';

import ModalContextProvider  from '@kangas/app/contexts/ModalContext';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalClient'

const DialogueModalContainer = (props) => {
    const [open, setOpen] = useState(false);
    //const { openModal, closeModal } = useContext(ModalContext);

    const { children, ...otherProps } = props;

    const openModal = useCallback(() => {
        setOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setOpen(false);
    }, []);

    return (
        <ModalContextProvider value={{
            openModal: openModal,
            closeModal: closeModal
        }}>
            <DialogueModal open={open} {...otherProps}>
                { children }
            </DialogueModal>
        </ModalContextProvider>
    )
}

export default DialogueModalContainer;
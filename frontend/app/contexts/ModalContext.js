'use client';

import { createContext, useContext, useCallback } from 'react';
import { ViewContext } from './ViewContext';

export const ModalContext = createContext({
    closeModal: () => null,
    openModal: () => null
});


const ModalProvider = ({ value, children }) => {
    const { pausePolling, resumePolling } = useContext(ViewContext);
    
    const openModal = useCallback(() => {
        value?.openModal();
        pausePolling();
    }, [value?.openModal, pausePolling]);

    const closeModal = useCallback(() => {
        console.log('HEY CLOSE')
        value?.closeModal();
        resumePolling();
    }, [value?.closeModal, resumePolling])

    return (
        <ModalContext.Provider value={{
            openModal: openModal,
            closeModal: closeModal
        }}>
            { children }
        </ModalContext.Provider>
    )
}


export default ModalProvider;



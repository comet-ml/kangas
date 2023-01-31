'use client';

import { createContext } from 'react';

export const ModalContext = createContext({
    closeModal: () => null,
    openModal: () => null
});


const ModalProvider = ({ value, children }) => {
    return (
        <ModalContext.Provider value={{
            openModal: value?.openModal,
            closeModal: value?.closeModal
        }}>
            { children }
        </ModalContext.Provider>
    )
}


export default ModalProvider;



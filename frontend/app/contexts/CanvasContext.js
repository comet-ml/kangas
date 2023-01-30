'use client';

import { createContext } from 'react';

export const CanvasContext = createContext({
    metadata: {}
});

const CanvasProvider = ({ value, children }) => {
    return (
        <CanvasContext.Provider value={{ metadata: { ...value } }}>
            { children }
        </CanvasContext.Provider>
    )
}


export default CanvasProvider;

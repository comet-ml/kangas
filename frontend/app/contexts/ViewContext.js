'use client';

import { createContext } from 'react';

const ViewContext = createContext({
    columns: {}
});


const ViewProvider = ({ value, children }) => {
    return (
        <ViewContext.Provider value={{ metadata: { ...value } }}>
            { children }
        </ViewContext.Provider>
    )
}


export default ViewProvider;


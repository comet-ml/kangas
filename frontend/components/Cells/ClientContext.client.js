import { createContext, useEffect, useState } from 'react';

export const ConfigContext = createContext({
    apiUrl: null,
    otherUrl: null,
    isIframe: false
});

const ClientContext = ({ apiUrl, otherUrl, inColab, children }) => {
    return (
        <ConfigContext.Provider
            value={{
                apiUrl,
                otherUrl,
                isIframe: inColab
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export default ClientContext;

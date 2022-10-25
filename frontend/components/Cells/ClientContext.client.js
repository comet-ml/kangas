import { createContext, useEffect, useState } from 'react';

export const ConfigContext = createContext({
    apiUrl: null,
    otherUrl: null,
    apiProxyUrl: null,
    isIframe: false
});

const ClientContext = ({ apiUrl, otherUrl, apiProxyUrl, inColab, children }) => {
    // const [isIframe, setIsIframe] = useState(false);

    /*useEffect(() => {
        if (window !== window.parent) {
            setIsIframe(true);
        }
    }, [])*/
    return (
        <ConfigContext.Provider
            value={{
                apiUrl,
                otherUrl,
                apiProxyUrl,
                isIframe: inColab
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export default ClientContext;

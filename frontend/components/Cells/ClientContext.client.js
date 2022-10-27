import { createContext, useEffect, useState } from 'react';

export const ConfigContext = createContext({
    apiUrl: null,
    otherUrl: null,
    isColab: false,
    isIframe: false
});

const ClientContext = ({ apiUrl, otherUrl, isColab, children }) => {
    // We check if the app is inside an iframe by comparing the window against its parent
    // but window is not defined server-side, so we use the effect hook to ensure it runs client side
    const [isIframe, setIsIframe] = useState(false);

    useEffect(() => {
        setIsIframe(window !== window.parent);

        // This is a hacky workaround
        // TODO Clean up when we upgrade Next
        if (window !== window.parent) {
            document.getElementById('matrix-select')?.setAttribute('style', 'display: none');
        }
    }, []);

    return (
        <ConfigContext.Provider
            value={{
                apiUrl,
                otherUrl,
                isColab,
                isIframe
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export default ClientContext;

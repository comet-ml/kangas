'use client';

import { createContext, useEffect, useState } from 'react';

export const EnvContext = createContext({
    apiUrl: null,
    otherUrl: null,
    isColab: false,
    isIframe: false
});

const ClientContext = ({ apiUrl, isColab, children }) => {
    // We check if the app is inside an iframe by comparing the window against its parent
    // but window is not defined server-side, so we use the effect hook to ensure it runs client side
    const [isIframe, setIsIframe] = useState(false);

    useEffect(() => {
        setIsIframe(window !== window.parent);
    }, []);

    return (
        <EnvContext.Provider
            value={{
                apiUrl,
                isColab,
                isIframe
            }}
        >
            {children}
        </EnvContext.Provider>
    );
};

export default ClientContext;

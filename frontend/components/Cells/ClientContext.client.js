import { createContext } from 'react';

export const ConfigContext = createContext({
    apiUrl: null,
    otherUrl: null,
    apiProxyUrl: null,
});

const ClientContext = ({ apiUrl, otherUrl, apiProxyUrl, children }) => {
    return (
        <ConfigContext.Provider
            value={{
                apiUrl,
                otherUrl,
                apiProxyUrl
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export default ClientContext;

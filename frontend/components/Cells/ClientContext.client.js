import { createContext } from 'react';

export const ConfigContext = createContext({
    apiUrl: null,
    otherUrl: null,
});

const ClientContext = ({ apiUrl, otherUrl, children }) => {
    return (
        <ConfigContext.Provider
            value={{
                apiUrl,
                otherUrl,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export default ClientContext;

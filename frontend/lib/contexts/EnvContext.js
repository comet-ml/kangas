'use client';

import { createContext, useReducer } from 'react';

export const ConfigContext = createContext({
    config: {     
        apiUrl: null,
        otherUrl: null,
        isColab: false,
        isIframe: false
    },
});

const reducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_CONFIG':
            return {
                config: {
                    ...state.config
                    ...action.payload
                }
            }
        default:
            return state
    }
}

const ConfigProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, value);
    return (
        <ConfigContext.Provider value={{
            config: state.config,
            updateConfig: (payload) => dispatch({ type: 'UPDATE_CONFIG', payload })
        }}>
            { children }
        </ConfigContext.Provider>
    )
}


export default ConfigProvider;



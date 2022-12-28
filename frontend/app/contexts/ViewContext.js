'use client';

import { createContext, useReducer } from 'react';

export const ViewContext = createContext({
    columns: {},
});

const reducer = (state, action) => {
    switch (action.type) {
        case 'RESIZE_COL_WIDTH':
            return {
                columns: {
                    ...state.columns,
                    ...action.payload
                }
            }
        default:
            return state
    }
}

const ViewProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, value);
    return (
        <ViewContext.Provider value={{
            columns: state.columns,
            updateWidth: (payload) => dispatch({ type: 'RESIZE_COL_WIDTH', payload })
        }}>
            { children }
        </ViewContext.Provider>
    )
}


export default ViewProvider;


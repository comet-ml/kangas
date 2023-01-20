'use client';

import { createContext, useEffect, useReducer } from 'react';

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
        case 'NEW_COLUMNS':
            return {
                columns: {
                    ...action.payload
                }
            }
        case 'UPDATE_COL_STATUS':
            return {
                columns: {
                    ...state.columns,
                    [action.payload.column]: {
                        ...state.columns[action.payload.column],
                        isLoading: action.payload.isLoading
                    }
                }
            }
        default:
            return state
    }
}

const ViewProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, value);

    // TODO Find a more performant solution than this quick-and-dirty patch
    useEffect(() => {
        if (
            JSON.stringify(Object.keys(state?.columns)) !== JSON.stringify(Object.keys(value?.columns)) && 
            !!value?.columns
        ) {
            dispatch({ type: 'NEW_COLUMNS', payload: value.columns })
        }
    }, [state?.columns, value?.columns, dispatch])

    return (
        <ViewContext.Provider value={{
            columns: state.columns,
            updateWidth: (payload) => dispatch({ type: 'RESIZE_COL_WIDTH', payload }),
            toggleLoading: (payload) => dispatch({ type: 'UPDATE_COL_STATUS', payload })
        }}>
            { children }
        </ViewContext.Provider>
    )
}


export default ViewProvider;


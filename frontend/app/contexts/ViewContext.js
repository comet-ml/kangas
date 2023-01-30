'use client';

import { createContext, useEffect, useReducer } from 'react';
import getDefaultCellSize from '../../lib/getDefaultCellSize';

export const ViewContext = createContext({
    columns: {},
    query: {}
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
                    ...action.payload.columns
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
        case 'UPDATE_QUERY':
            return {
                query: {
                    ...action.payload.query
                }
            }
        default:
            return state
    }
}

const ViewProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, value);

    useEffect(() => {
        if (state?.query?.datagrid != value?.query?.datagrid) {
            dispatch({ type: 'NEW_COLUMNS', payload: { columns: value?.columns } })
            dispatch({ type: 'UPDATE_QUERY', payload: { query: value?.query } })
        } else if (JSON.stringify(Object.keys(state?.query ?? {})) !== JSON.stringify(Object.keys(value?.query))) {
            dispatch({ type: 'UPDATE_QUERY', payload: { query: value?.query }});
        }

    }, [state?.query, value?.query]);

    return (
        <ViewContext.Provider value={{
            columns: state.columns,
            query: state.query,
            updateWidth: (payload) => dispatch({ type: 'RESIZE_COL_WIDTH', payload }),
            toggleLoading: (payload) => dispatch({ type: 'UPDATE_COL_STATUS', payload })
        }}>
            { children }
        </ViewContext.Provider>
    )
}


export default ViewProvider;


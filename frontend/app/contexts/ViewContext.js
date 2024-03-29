'use client';

import { createContext, useCallback, useEffect, useReducer } from 'react';

export const ViewContext = createContext();

const initialState = {
    columns: {},
    query: {},
    view: {
        start: 0,
        stop: 10
    },
    isLoading: false,
    shouldPoll: true
}

const reducer = (state=initialState, action) => {
    switch (action.type) {
        case 'RESIZE_COL_WIDTH':
            return {
                ...state,
                columns: {
                    ...state.columns,
                    ...action.payload
                }
            }
        case 'NEW_COLUMNS':
            return {
                ...state,
                columns: {
                    ...action.payload.columns
                },
                query: {
                    ...action.payload.query
                }
            }
        case 'UPDATE_COL_STATUS':
            return {
                ...state,
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
                ...state,
                query: {
                    ...action.payload.query
                }
            }
        case 'UPDATE_VIEW':
            return {
                ...state,
                view: {
                    ...state.view,
                    ...action.payload.view
                }
            }
        case 'BEGIN_LOADING':
            return {
                ...state,
                isLoading: true
            }
        case 'COMPLETE_LOADING':
            return {
                ...state,
                isLoading: false
            }
        case 'PAUSE_POLLING':
            return {
                ...state,
                shouldPoll: false
            }
        case 'RESUME_POLLING':
            return {
                ...state,
                shouldPoll: true
            }
        default:
            return state
    }
}

const ViewProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, { ...initialState, ...value });

    // TODO Find a more performant solution than this quick-and-dirty patch
    useEffect(() => {
        const shouldUpdate = (state?.query?.dgid !== value?.query?.dgid) || (state?.query?.groupBy !== value?.query?.groupBy)
        if (shouldUpdate) {
            dispatch({ type: 'NEW_COLUMNS', payload: { columns: value.columns, query: value.query } })
        }
    }, [state?.query, value?.query, dispatch])

    return (
        <ViewContext.Provider value={{
            columns: state.columns,
            view: state.view,
            updateWidth: (payload) => dispatch({ type: 'RESIZE_COL_WIDTH', payload }),
            toggleLoading: (payload) => dispatch({ type: 'UPDATE_COL_STATUS', payload }),
            updateView: (payload) => dispatch({ type: 'UPDATE_VIEW', payload }),
            beginLoading: () => dispatch({ type: 'BEGIN_LOADING' }),
            completeLoading: () => dispatch({ type: 'COMPLETE_LOADING'}),
            pausePolling: () => dispatch({ type: 'PAUSE_POLLING' }),
            resumePolling: () => dispatch({ type: 'RESUME_POLLING' }),
            shouldPoll: !!state?.shouldPoll,
            isLoading: state?.isLoading,
            query: state?.query
        }}>
            { children }
        </ViewContext.Provider>
    )
}


export default ViewProvider;


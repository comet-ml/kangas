'use client';

import { createContext, useEffect, useReducer } from 'react';

export const LoadingContext = createContext({});


const reducer = (state, action) => {
    switch (action.type) {
        case 'BEGIN_LOADING':
            return {
                ...state.loading,
                isLoading: true
            };
        case 'COMPLETE_LOADING':
            return {
                ...state.loading,
                isLoading: false
            }
        default:
            return state;
    }
}

const LoadingProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, value);

    useEffect(() => {
        // We are only concerned about displaying a loading indicator when render is hanging
        // By definition, this effect hook runs after render, and so we no longer need to display a loading indicator
        if (state?.isLoading) dispatch({ type: 'COMPLETE_LOADING'})
    }, [dispatch, state?.isLoading]);

    return (
        <LoadingProvider.Provider value={{
            beginLoading: () => dispatch({ type: 'BEGIN_LOADING' }),
            completeLoading: () => dispatch({ type: 'COMPLETE_LOADING'}),
            isLoading: state?.isLoading
        }}>
            { children }
        </LoadingProvider.Provider>
    )
}


export default LoadingProvider;



'use client';

import { createContext, useEffect, useMemo, useReducer } from 'react';

export const CanvasContext = createContext({
    images: {},
    labels: {},
    hiddenLabels: {},
    score: null,
    scoreRange: {
        min: 0,
        max: 1
    },
});

const reducer = (state, action) => {
    switch (action.type) {
        case 'ADD_IMAGE_METADATA':
            return {
                ...state,
                images: {
                    ...state.images,
                    [action.payload.assetId]: {
                        ...action.payload.metadata,
                        fetchedMeta: true
                    }
                }
            }
        case 'UPDATE_SCORE': {
            return {
                ...state,
                score: action.payload
            }
        }
        case 'UPDATE_SCORE_RANGE': {
            return {
                ...state,
                scoreRange: { ...action.payload }
            }
        }
        case 'HIDE_LABEL': {
            return {
                ...state,
                hiddenLabels: { ...state.hiddenLabels, [action.payload]: true }
            }
        }
        case 'SHOW_LABEL':
            const hidden = { ...state.hiddenLabels }
            delete hidden[action.payload];

            return {
                ...state,
                hiddenLabels: { ...hidden }
            }
        default:
            return state
    }
}


const CanvasProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, value);
    // const visibleLabels = useMemo()

    console.log(state);
    return (
        <CanvasContext.Provider value={{ 
            metadata: { ...value },
            images: { ...state.images },
            labels: [ ...value.labels ],
            isGroup: !!value?.isGroup,
            updateScore: (payload) => dispatch({ type: 'UPDATE_SCORE', payload }),
            updateScoreRange: (payload) => dispatch({ type: 'UPDATE_SCORE_RANGE', payload }),
            hideLabel: (payload) => dispatch({ type: 'HIDE_LABEL', payload }),
            showLabel: (payload) => dispatch({ type: 'SHOW_LABEL', payload }),
            addImageMetadata: (payload) => dispatch({ type: 'ADD_IMAGE_METADATA', payload})
        }}>
            { children }
        </CanvasContext.Provider>
    )
}


export default CanvasProvider;

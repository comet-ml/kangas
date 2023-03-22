'use client';

import { createContext, useEffect, useMemo, useReducer } from 'react';

import { makeTag } from '../../lib/tags';

export const CanvasContext = createContext({
    images: {},
    labels: [],
    hiddenLabels: {},
    score: null,
    scoreRange: {
        min: 0,
        max: 1
    },
    settings: {
        zoom: 1.0,
	smooth: true,
	gray: false,
    }
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
       /* case 'UPDATE_SCORE_RANGE': {
            return {
                ...state,
                scoreRange: { ...action.payload }
            }
        }*/
        case 'HIDE_LABEL': {
            return {
                ...state,
                hiddenLabels: { ...state.hiddenLabels, [action.payload]: true }
            }
        }
        case 'SHOW_LABEL':
            return {
                ...state,
                hiddenLabels: {
                    ...state.hiddenLabels,
                    [action.payload]: false
                }
            }
        case 'ADD_LABELS': {
            return {
                ...state,
                labels: [
                    ...state.labels,
                    ...action.payload
                ]
            }
        }
        case 'UPDATE_CANVAS_SETTINGS': {
            return {
                ...state,
                settings: {
                    ...state.settings,
                    ...action.payload
                }
            }
        }
        default:
            return state
    }
}


const CanvasProvider = ({ value, children }) => {
    const [state, dispatch] = useReducer(reducer, value);

    // Object.keys(value?.metadata?.['(uncategorized)']?.labels ?? {})
    const getGroupTags = (metadata) => {
	const tags = [];
	if (metadata) {
	    for (let layer of Object.keys(metadata)) {
		if (metadata[layer]?.labels) {
		    tags.push(...Object.keys(metadata[layer].labels).map(label => makeTag(layer, label)));
		}
	    }
	}
	return Array.from(new Set(tags));
    };

    const getTags = (assetMetadata) => {
        const tags = [];
        if (assetMetadata) {
            if (assetMetadata.metadata) {
                if (assetMetadata.metadata.annotations) {
                    for (let annotation of assetMetadata.metadata.annotations) {
                        if (annotation.data) {
                            for (let data of annotation.data) {
                                if (data.label) {
                                    tags.push(makeTag(annotation.name, data.label));
                                }
                                if (data.labels) {
                                    for (let label of data.labels) {
                                        tags.push(makeTag(annotation.name, label));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return Array.from(new Set(tags));
    };

    return (
        <CanvasContext.Provider value={{
            metadata: { ...value.metadata },
            images: { ...state.images },
            isGroup: !!value?.isGroup,
            labels:  value?.isGroup ? getGroupTags(value?.metadata) : getTags(value),
            updateScore: (payload) => dispatch({ type: 'UPDATE_SCORE', payload }),
            updateScoreRange: (payload) => dispatch({ type: 'UPDATE_SCORE_RANGE', payload }),
            hideLabel: (payload) => dispatch({ type: 'HIDE_LABEL', payload }),
            showLabel: (payload) => dispatch({ type: 'SHOW_LABEL', payload }),
            addImageMetadata: (payload) => dispatch({ type: 'ADD_IMAGE_METADATA', payload}),
            addLabels: (payload) => dispatch({ type: 'ADD_LABELS', payload }),
            score: state.score,
            hiddenLabels: state.hiddenLabels,
            settings: state.settings,
            updateSettings: (payload) => dispatch({ type: 'UPDATE_CANVAS_SETTINGS', payload }),
        }}>
            { children }
        </CanvasContext.Provider>
    )
}


export default CanvasProvider;

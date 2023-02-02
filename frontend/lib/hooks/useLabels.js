import { useState, useMemo, useCallback, useContext } from 'react';
import { CanvasContext } from '../../app/contexts/CanvasContext';

/*

Old overlay structure (example):

metadata = {"overlays": [
    {
     "label": "person",
     "boxes": [[[x1, y1], [x2, y2]], ...],
     "regions": [[[x1, y1, x2, y2, x3, y3, ...],
     "score": 0.45,
    },
    ...
]}

New annotation structure (example):

metadata = {"annotations": [
    {
     "name": "(uncategorized)",
     "data": [
         {
          "label": "person",
          "boxes": [[x, y, w, h], ...],
          "regions": [[[x1, y1, x2, y2, x3, y3, ...],
          "score": 0.45,
         },
         ...
     ]
    },
    ...
]}

*/


const useLabels = (assetId) => {
    // TODO: Update this to use context
    const { images, hiddenLabels, score, scoreRange } = useContext(CanvasContext);
    const image = useMemo(() => images?.[assetId], [assetId, images?.[assetId]]);
    const labels = useMemo(() => images?.[assetId]?.labels, [assetId, images?.[assetId]?.labels]);
    const overlays = useMemo(() =>  images?.[assetId]?.overlays, [assetId, images?.[assetId]?.overlays]);
    const annotations = useMemo(() => images?.[assetId]?.annotations, [images?.[assetId]?.annotations]);

/*
    useEffect(() => {
        if (!!annotations) {
            for (const layer of Object.values(annotations)) {
                for (const annotation of Object.values(layer)) {
                // Filter logic
                    if (typeof annotation?.score === 'number') {
                        if (annotation.score < min) min = annotation.score;
                        if (annotation.score > max) max = annotation.score;
                    }
                }
            }
        }
        return { min, max };
    }, [annotations]);

    const labels = useMemo(() => {
        if (!!annotations) {
            return annotations?.data.filter(data => (!data?.score || (data?.score > score)) && !hiddenLabels?.[data?.label]);
        } else {
            return [];
        }
    }, [score, hiddenLabels]);

    const updateScore = useCallback((e) => setScore(e.target.value), []);
    const toggleLabel = useCallback((label) => {
        if (hiddenLabels?.[label.label]) {
            const { [label.label]: removed, ...remaining } = hiddenLabels;
            //setHiddenLabels(remaining);
        } else {
            /*setHiddenLabels({
                ...hiddenLabels,
                [label.label]: true
            }); */
       /* }
    }, [hiddenLabels]); 

    return {
        labels,
        scoreRange,
        updateScore,
        toggleLabel
    }; */

    return {
        labels,
        overlays,
        scoreRange: {},
        updateScore: () => console.log('e'),
        toggleLabel: () => console.log('e'),
        image
    }
}

export default useLabels;

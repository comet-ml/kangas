import { useState, useMemo, useCallback } from 'react';

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


const useLabels = (metadata) => {
    const [score, setScore] = useState(0);
    const [hiddenLabels, setHiddenLabels] = useState({ });

    const scoreRange = useMemo(() => {
        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;

        if (metadata?.annotations) {
            for (const layer of Object.values(metadata.annotations)) {
                for (const annotation of Object.values(layer)) {
                // Filter logic
                // TODO Fix below bug (potential) with 0-scores
                    if (typeof(annotation?.score) !== 'undefined') {
                        if (annotation.score < min) min = annotation.score;
                        if (annotation.score > max) max = annotation.score;
                    }
                }
            }
        }
        return { min, max };
    }, [metadata?.annotations]);

    const labels = useMemo(() => {
        if (metadata?.annotations) {
            return metadata.annotations?.data.filter(data => (!data?.score || (data?.score > score)) && !hiddenLabels?.[data?.label]);
        } else {
            return [];
        }
    }, [metadata?.overlays, score, hiddenLabels]);

    const updateScore = useCallback((e) => setScore(e.target.value), []);
    const toggleLabel = useCallback((label) => {
        if (hiddenLabels?.[label.label]) {
            const { [label.label]: removed, ...remaining } = hiddenLabels;
            setHiddenLabels(remaining);
        } else {
            setHiddenLabels({
                ...hiddenLabels,
                [label.label]: true
            });
        }
    }, [hiddenLabels]);

    return {
        labels,
        scoreRange,
        updateScore,
        toggleLabel
    };
};

export default useLabels;

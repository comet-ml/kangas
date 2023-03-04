import { useState, useMemo, useCallback, useContext, useEffect } from 'react';
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
          "points": [[[x1, y1, x2, y2, x3, y3, ...],
          "score": 0.45,
         },
         ...
     ]
    },
    ...
]}

*/


const useLabels = ({ assetId, dgid, timestamp }) => {
    const {
        images,
        hiddenLabels,
        score,
        scoreRange,
        addImageMetadata,
        updateScore,
        updateScoreRange,
        showLabel,
        hideLabel
    } = useContext(CanvasContext);

    // TODO Support annotations from multiple groups, not just [0] == '(uncategorized)'
    const image = useMemo(() => images?.[assetId], [assetId, images?.[assetId]]);
    const annotations = useMemo(() => images?.[assetId]?.annotations?.[0], [images?.[assetId]?.annotations?.[0]]);
    const dimensions = useMemo(() => ({ ...images?.[assetId]?.image }), [images?.[assetId]?.image])

    useEffect(() => {
        if (!image?.fetchedMeta) {
            fetch(`/api/assetMetadata?assetId=${assetId}&dgid=${dgid}&timestamp=${timestamp}`, { next: { revalidate: 10000 }, cache: 'force-cache' })
            .then(res => res.json())
            .then(metadata => addImageMetadata({ assetId, metadata }))
        }
    }, [image?.fetchedMeta]);

    const labels = useMemo(() => {
        if (!!annotations?.data) {
            if (typeof score !== 'number') {
                return annotations?.data
            }
            else {
                const filtered =  annotations?.data?.filter(data => (!data?.score || (data?.score > score) && !hiddenLabels?.[data?.label]));
                return filtered;
            }
        } else {
            return [];
        }
    }, [score, hiddenLabels, annotations]);

    return {
        annotations,
        labels,
        scoreRange: {},
        updateScore,
        updateScoreRange,
        toggleLabel: () => console.log('e'),
        hideLabel,
        showLabel,
        image,
        dimensions,
        score,
        hiddenLabels
    }
}

export default useLabels;

import { useState, useMemo, useCallback, useContext, useEffect } from 'react';
import { CanvasContext } from '../../app/contexts/CanvasContext';
import fetchIt from '../fetchIt';
import config from '../../config';

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
    const layers = useMemo(() => images?.[assetId]?.annotations, [images?.[assetId]?.annotations]);
    const dimensions = useMemo(() => ({ ...images?.[assetId]?.image }), [images?.[assetId]?.image])

    useEffect(() => {
        if (!image?.fetchedMeta) {
            fetchIt({url: `${config.rootPath}api/assetMetadata`, query: { assetId, dgid, timestamp }})
            .then(metadata => addImageMetadata({ assetId, metadata }))
        }
    }, [image?.fetchedMeta]);

    return {
        annotations,
	layers,
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

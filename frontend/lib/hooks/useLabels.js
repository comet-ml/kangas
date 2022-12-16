import { useState, useMemo, useCallback } from 'react';


const useLabels = (metadata) => {
    const [score, setScore] = useState(0);
    const [hiddenLabels, setHiddenLabels] = useState({ })

    const scoreRange = useMemo(() => {
        let min = 0;
        let max = 1;

        if (metadata?.overlays) {

            for (const overlay of Object.values(metadata.overlays)) {

                // Filter logic
                // TODO Fix below bug (potential) with 0-scores
                if (overlay?.score) {
                    if (min > overlay?.score) min = overlay?.score;
                    if (max < overlay?.score) max = overlay?.score;
                }
            }
        }

        return { min, max }
    }, [metadata?.overlays]);

    const labels = useMemo(() => {
        if (metadata?.overlays) {
            return Object.values(metadata.overlays).filter(label => (!label?.score || (label?.score > score)) && !hiddenLabels?.[label.label]);
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
            })
        }
    }, [hiddenLabels])

    return {
        labels,
        scoreRange,
        updateScore,
        toggleLabel
    }

}

export default useLabels;
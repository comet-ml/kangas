import { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import useMetadata from '../../../lib/useMetadata';
import useAsset from '../../../lib/useAsset';
import { CircularProgress } from '@mui/material';
const Canvas = ({ url, drawImage, dgid, scoreBound, ref }) => {
    const [loaded, setLoaded] = useState(false);
    const canvas = useRef();
    const image = useRef();
    const [filteredLabels, setFilteredLabels] = useState([]);
    const assetId = useMemo(() => {
        const searchParams = new URL(url).searchParams;
        return searchParams.get('assetId');
    }, [url]);

    const parsedMeta = useMetadata(dgid, assetId);
    const imageSrc = useAsset(url);

    useEffect(() => {
        if (!scoreBound || !parsedMeta?.overlays) return;
        const below = parsedMeta?.overlays?.filter(
            (overlay) => overlay?.score < scoreBound
        );
        setFilteredLabels(below.map((x) => x.label));
    }, [parsedMeta, scoreBound]);

    const load = useCallback(() => {
        if (!canvas || !image || !parsedMeta) return;
        drawImage(canvas, image, parsedMeta, filteredLabels);
        setLoaded(true)
    }, [drawImage, parsedMeta, filteredLabels]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="canvas-container" ref={ref}>
            <canvas ref={canvas} className={`image-canvas ${!loaded && 'hidden'}`} />
            { !loaded && <CircularProgress /> }
            <img
                ref={image}
                src={imageSrc}
                crossOrigin={'Anonymous'}
                className='hidden'
                onLoad={load}
                alt="DataGrid Image"
            />
        </div>
    );
};


export default Canvas;

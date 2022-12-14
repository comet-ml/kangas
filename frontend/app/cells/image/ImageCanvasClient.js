'use client';

import { useCallback, useContext, useEffect, useRef } from 'react';
import { EnvContext } from "../../../lib/contexts/EnvContext";

const ImageCanvasClient = ({ value, query, columnName, expanded, image }) => {
    const canvas = useRef();
    const drawImage = useCallback(() => {
        const ctx = canvas.current?.getContext("2d");
        const img = new Image;
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = `data:application/octet-stream;base64,${image}`
    }, [image]);

    useEffect(() => {
        drawImage()
    }, [drawImage]);

    return <canvas ref={canvas}  />
}

export default ImageCanvasClient;
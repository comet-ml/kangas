'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnvContext } from "../../../lib/contexts/EnvContext";
import computeScale from '../../../lib/computeScale';
const ImageCanvasClient = ({ value, query, columnName, metadata, image }) => {
    const canvas = useRef();
    const [scoreRange, setScoreRange] = useState({ min: 0, max: 1 });


    const drawImage = useCallback(() => {
        const ctx = canvas.current?.getContext("2d");
        // TODO That funky computeScale business
        //ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

        const img = new Image;
        img.src = `data:application/octet-stream;base64,${image}`
        ctx.drawImage(img, 0, 0)

        const imageScale = 1;
        // We don't need the alpha statements, since they are constants
        // Can also ignore mask logic because again, set as a constant

        // TODO Make this stateful
        ctx.imageSmoothingEnabled = true

        if (metadata?.overlays) {
            for (const overlay of Object.values(metadata.overlays)) {

                // Filter logic
                // TODO Fix below bug (potential) with 0-scores
                if (overlay?.score) {
                    if (scoreRange.min > overlay?.score) setScoreRange({ ...scoreRange, min: overlay?.score });
                    if (scoreRange.max < overlay?.score) setScoreRange({ ...scoreRange, max: overlay?.score });
                }

                if (overlay?.type === 'regions') {
                    for (const region of overlay?.data) {
                        // TODO Implement the color generator
                        ctx.fillStyle = 'blue';
                        ctx.beginPath();
                        ctx.moveTo(
                            region[0],
                            region[1] 
                        );

                        for (let i = 2; i < region.length; i += 2) {
                            ctx.lineTo(
                                region[i],
                                region[i + 1]
                            );
                        };

                        ctx.closePath();
                        ctx.fill();
                    }
                } else if (overlay?.type === 'boxes') {
                    for (const box of overlay.data) {
                        const [[x1, y1], [x2, y2]] = box;
                        ctx.strokeStyle = 'red';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(x1 * imageScale, y1 * imageScale);
                        ctx.lineTo(x2 * imageScale, y1 * imageScale);
                        ctx.lineTo(x2 * imageScale, y2 * imageScale);
                        ctx.lineTo(x1 * imageScale, y2 * imageScale);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            }
        }


    }, [image]);

    useEffect(() => {
        drawImage()
    }, [drawImage]);

    return <canvas ref={canvas} height={600} width={600}  />
}

export default ImageCanvasClient;
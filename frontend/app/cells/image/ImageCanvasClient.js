'use client';

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { EnvContext } from "../../../lib/contexts/EnvContext";
import computeScale from '../../../lib/computeScale';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import CanvasContext from '../../contexts/CanvasContext';

const cx = classNames.bind(styles);

const ImageCanvasClient = ({ metadata, image }) => {
    const imageCanvas = useRef();
    const labelCanvas = useRef();
    const [score, setScore] = useState(0);

    /* 
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
    */

    const labels = useMemo(() => {
        if (metadata?.overlays) {
            return Object.values(metadata.overlays).filter(label => !label?.score || (label?.score > score));
        } else {
            return [];
        }
    }, [metadata?.overlays, score]);

    const updateScore = useCallback((e) => setScore(e.target.value), []);
    const drawImage = useCallback(() => {
        const ctx = imageCanvas.current?.getContext("2d");
        // TODO That funky computeScale business
        ctx.clearRect(0, 0, imageCanvas.current.width, imageCanvas.current.height);

        const img = new Image;
        img.onload = () => ctx.drawImage(img, 0, 0)
        img.src = `data:application/octet-stream;base64,${image}`
    }, [image]);

    const drawLabels = useCallback(() => {
        const ctx = labelCanvas.current?.getContext("2d");
        ctx.clearRect(0, 0, labelCanvas.current.width, labelCanvas.current.height);

        const imageScale = 1;
        // We don't need the alpha statements, since they are constants
        // Can also ignore mask logic because again, set as a constant

        // TODO Make this stateful
        ctx.imageSmoothingEnabled = true

        for (const overlay of labels) {
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
    }, [metadata, labels])

    useEffect(() => {
        drawImage();
    }, [drawImage]);

    useEffect(() => {
        drawLabels();
    }, [drawLabels]);

    return (
        <div className={cx('image-editor')}>
            <div className={cx('editor-controls')}>
                <div className="score-control">
                    <div className="slider-container">
                        <div className="zoom-label">Score:</div>
                        <input
                            type="range"
                            // ref={scoreRef}
                            min="0"
                            max="1"
                            defaultValue="0"
                            className="zoom-slider"
                            id="zoom-slide"
                            step="0.001"
                            onChange={updateScore}
                        />
                    </div>
                </div>
            </div>
            <div className={cx('canvas-column')}>
                <div className={cx('canvas-container')}>
                    <canvas ref={imageCanvas} height={472} width={492} />
                    <canvas ref={labelCanvas} height={472} width={492} />
                </div>
            </div>
        </div>
    )
}

export default ImageCanvasClient;
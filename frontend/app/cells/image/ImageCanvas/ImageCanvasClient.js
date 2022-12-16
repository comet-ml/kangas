'use client';

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import computeScale from '../../../../lib/computeScale';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import useLabels from '../../../../lib/hooks/useLabels';

const cx = classNames.bind(styles);

const Label = ({ label, toggle }) => {
    return (
        <div onClick={() => toggle(label)} style={{ background: 'blue' }}>
            {`${label?.label}`}
        </div>
    )
}

const ImageCanvasClient = ({ metadata, image }) => {
    const imageCanvas = useRef();
    const labelCanvas = useRef();
    const { labels, scoreRange, updateScore, toggleLabel } = useLabels(metadata);
    
    
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
                            min={`${scoreRange.min}`}
                            max={`${scoreRange.max}`}
                            defaultValue={`${scoreRange.min}`}
                            className="zoom-slider"
                            id="zoom-slide"
                            step="0.001"
                            onChange={updateScore}
                        />
                    </div>
                </div>
                <div className={cx('labels-container')}>
                    { labels?.map(l => <Label toggle={toggleLabel} label={l} />) }
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
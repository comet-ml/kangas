'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext } from 'react';
import computeScale from '../../../../lib/computeScale';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor, getContrastingColor } from '../../../../lib/generateChartColor';
import { CanvasContext } from '../../../contexts/CanvasContext';

const cx = classNames.bind(styles);

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

const Label = ({ label, toggle }) => {
    const color = getColor(label.label);
    const textColor = getContrastingColor(color);
    return (
            <div onClick={() => toggle(label)} style={{ background: color, color: textColor}}>
            {`${label?.label}`}
        </div>
    );
}

const ImageCanvasClient = ({ image }) => {
    const imageCanvas = useRef();
    const labelCanvas = useRef();
    const { metadata } = useContext(CanvasContext);
    const { labels, scoreRange, updateScore, toggleLabel } = useLabels(metadata);

    console.log(labels);

    const drawImage = useCallback(() => {
        const ctx = imageCanvas.current?.getContext("2d");
        // TODO That funky computeScale business
        ctx.clearRect(0, 0, imageCanvas.current.width, imageCanvas.current.height);

        const img = new Image;
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = `data:application/octet-stream;base64,${image}`;
    }, [image]);

    const drawLabels = useCallback(() => {
        const ctx = labelCanvas.current?.getContext("2d");
        ctx.clearRect(0, 0, labelCanvas.current.width, labelCanvas.current.height);

        const imageScale = 1;
        // We don't need the alpha statements, since they are constants
        // Can also ignore mask logic because again, set as a constant

        // TODO Make this stateful
        ctx.imageSmoothingEnabled = true;

        for (const annotation of labels) {
            if (annotation?.regions) {
                for (const region of annotation.regions) {
                    // TODO Implement the color generator
                    ctx.fillStyle = getColor(annotation.label);
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
            } else if (annotation?.boxes) {
                for (const box of annotation.boxes) {
                    const [x, y, w, h] = box;
                    ctx.strokeStyle = getColor(annotation.label);
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x * imageScale, y * imageScale);
                    ctx.lineTo((x + w) * imageScale, y * imageScale);
                    ctx.lineTo((x + w) * imageScale, (y + h) * imageScale);
                    ctx.lineTo(x * imageScale, (y + h) * imageScale);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }
    }, [metadata, labels]);

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
    );
}

export default ImageCanvasClient;

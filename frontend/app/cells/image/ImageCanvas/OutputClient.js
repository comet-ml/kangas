'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor } from '../../../../lib/generateChartColor';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

function computeScale(canvasWidth, canvasHeight, width, height) {
    if (width > height) {
        if (width < canvasWidth) {
            return Math.max(width / canvasWidth, canvasWidth / width);
        } else {
            return Math.min(width / canvasWidth, canvasWidth / width);
        }
    } else {
        if (height < canvasHeight) {
            return Math.max(height / canvasHeight, canvasHeight / height);
        } else {
            return Math.min(height / canvasHeight, canvasHeight / height);
        }
    }
}



const ImageCanvasOutputClient = ({ assetId, dgid, timestamp, imageSrc }) => {
    const containerRef = useRef();
    const labelCanvas = useRef();
    const img = useRef();
    const [loaded, setLoaded] = useState(false);
    const { 
        overlays, 
        dimensions, 
        score,
        hiddenLabels
    } = useLabels({ assetId, timestamp, dgid });

    const isVertical = useMemo(() => dimensions?.height > dimensions?.width, [dimensions]);

    const onLoad = useCallback(() => setLoaded(true), []);

    const drawLabels = useCallback(() => {
        labelCanvas.current.width = img.current.width;
        labelCanvas.current.height = img.current.height;
        const imageScale = computeScale(img.current.width, img.current.height, img.current.naturalWidth, img.current.naturalHeight)

        if (overlays) {
            const ctx = labelCanvas.current.getContext("2d");
            for (let reg = 0; reg < overlays.length; reg++) {
                if (overlays[reg]?.score) {
                    /*const score = overlays[reg].score;
                    // Update the score range, if appropriate
                    if (scoreRange.min > score)
                        setScoreRange({ ...scoreRange, min: score });
                    if (scoreRange.max < score)
                        setScoreRange({ ...scoreRange, max: score });

                    // Filter labels outside of range. For multi-view, the individual canvas does this
                    if (!isMulti && scoreBound > score)
                        removeLabel(overlays[reg].label);*/
                    if (overlays[reg]?.score < score) continue;
                }
                if (overlays[reg].type === 'regions') {
                    const regions = overlays[reg].data;
                    if (!hiddenLabels?.[overlays[reg].label]) {
                        for (let r = 0; r < regions.length; r++) {
                            const region = regions[r];
                            ctx.fillStyle = getColor(
                                overlays[reg].label
                            );
                            ctx.beginPath();
                            ctx.moveTo(
                                region[0] * imageScale,
                                region[1] * imageScale
                            );
                            for (let i = 2; i < region.length; i += 2) {
                                ctx.lineTo(
                                    region[i] * imageScale,
                                    region[i + 1] * imageScale
                                );
                            }
                            ctx.closePath();
                            ctx.fill();
                        }
                    }
                } else if (overlays[reg].type === 'boxes') {
                    const boxes = overlays[reg].data;
                    if (!hiddenLabels?.[overlays[reg].label]) {
                        for (let r = 0; r < boxes.length; r++) {
                            const [[x1, y1], [x2, y2]] = boxes[r];
                            ctx.strokeStyle = getColor(
                                overlays[reg].label
                            );
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
                } else if (overlays[reg].type === 'annotations') {
                    // FIXME: text, anchor, points
                }
            }
        }
    }, [overlays, score, isVertical, hiddenLabels]);

    useEffect(() => {
        if (loaded) {
            drawLabels();
        }
    }, [loaded, drawLabels])

    return (
        <div className={cx('canvas-container', { vertical: isVertical })} ref={containerRef}>
            <canvas className={cx(['output', 'canvas'], { vertical: isVertical })} ref={labelCanvas} />
            <img 
                className={cx(['output', 'image'], { vertical: isVertical })} 
                ref={img} src={imageSrc} 
                loading="lazy" 
                onLoad={onLoad}
            />
        </div>
    )

}

export default ImageCanvasOutputClient;

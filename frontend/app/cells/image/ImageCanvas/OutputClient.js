'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor } from '../../../../lib/generateChartColor';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

function computeScale(canvasWidth, canvasHeight, width, height) {
    if (width > height) return canvasHeight / height;
    console.log('skinny')
    console.log(canvasHeight/height)
    return canvasHeight / height;
}

const ImageCanvasOutputClient = ({ assetId, dgid, timestamp, imageSrc }) => {
    const containerRef = useRef();
    const labelCanvas = useRef();
    const img = useRef();
    const [loaded, setLoaded] = useState(false);
    const { 
        annotations, 
        dimensions, 
        score,
        labels,
        hiddenLabels,
    } = useLabels({ assetId, timestamp, dgid });

    const { settings, isGroup } = useContext(CanvasContext);

    const isVertical = useMemo(() => dimensions?.height > dimensions?.width, [dimensions]);

    const onLoad = useCallback(() => setLoaded(true), []);
    const zoom = useMemo(() => Math.max(settings?.zoom ?? 1, 1), [settings?.zoom]);

    const imageScale = useMemo(() => {
        if (!loaded) return 1;

        return Math.max(
            computeScale(
                300 * zoom,
                isVertical ? 400 * zoom : 300 * zoom,
                img.current.naturalWidth,
                img.current.naturalHeight
            )
        )
    }, [settings?.zoom, isVertical, loaded, zoom]);

    const drawLabels = useCallback(() => {
        if (labels) {
            const ctx = labelCanvas.current.getContext("2d");
            ctx.clearRect(0, 0, labelCanvas.current.width, labelCanvas.current.height);
            for (let reg = 0; reg < labels.length; reg++) {
                if (labels[reg]?.score) {
                    if (annotations[reg]?.score < score) continue;
                }
                if (!!labels[reg]?.regions) {
                    const regions = labels[reg].regions;
                    if (!hiddenLabels?.[labels[reg].label]) {
                        for (let r = 0; r < regions.length; r++) {
                            const region = regions[r];
                            ctx.fillStyle = getColor(
                                labels[reg].label
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
                } else if (!!labels[reg]?.boxes) {
                    const boxes = labels[reg].boxes;
                    if (!hiddenLabels?.[labels[reg]?.label]) {
                        for (let r = 0; r < boxes.length; r++) {
                            const [x1, y1, x2, y2] = boxes[r];
                            ctx.strokeStyle = getColor(
                                labels[reg].label
                            );
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(x1 * imageScale, y1 * imageScale);
                            ctx.lineTo((x1 + x2) * imageScale, y1 * imageScale);
                            ctx.lineTo((x1 + x2) * imageScale, (y1 + y2) * imageScale);
                            ctx.lineTo(x1 * imageScale, (y1 + y2) * imageScale);
                            ctx.closePath();
                            ctx.stroke();
                        }
                    }
                } else if (labels[reg]?.annotations) {
                    // TODO: text, anchor, points
                }
            }
        }
    }, [imageScale, score, hiddenLabels, labels]);

    

    useEffect(() => {
        if (loaded) { 
            if (!isGroup) {
                labelCanvas.current.width = img.current.naturalWidth * imageScale;
                labelCanvas.current.height = img.current.naturalHeight * imageScale;
                containerRef.current.style.width = `${img.current.naturalWidth * imageScale}px`;
                containerRef.current.style.height = `${img.current.naturalHeight * imageScale + 4}px`;
    
                img.current.height = img.current.naturalHeight * imageScale;
                img.current.width = img.current.naturalWidth * imageScale;
            }
    
            else if (isGroup) {
                labelCanvas.current.width = img.current.width;
                labelCanvas.current.height = img.current.height;
                containerRef.current.style.width = `${img.current.width}px`;
                containerRef.current.style.height = `${img.current.height + 4}px`;
            }
    
            /*
            if (!isGroup) {
                labelCanvas.current.width = img.current.naturalWidth * imageScale;
                labelCanvas.current.height = img.current.naturalHeight * imageScale;
                containerRef.current.style.width = `${img.current.naturalWidth * imageScale}px`;
                containerRef.current.style.height = `${img.current.naturalHeight * imageScale + 4}px`;    
            }*/

            drawLabels();
        }
    }, [loaded, drawLabels])

    return (
        <div className={cx('canvas-container', { vertical: isGroup && isVertical })} ref={containerRef}>
            <canvas className={cx(['output', 'canvas'], { vertical: isGroup && isVertical })} ref={labelCanvas} />
            <img 
                className={cx(['output', 'image'], { vertical: isGroup && isVertical })}
                ref={img} src={imageSrc} 
                loading="lazy" 
                onLoad={onLoad}
            />
        </div>
    )

}

export default ImageCanvasOutputClient;

'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor } from '../../../../lib/generateChartColor';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

function computeScale(canvasWidth, canvasHeight, width, height) {
    if (width > height) return canvasWidth / width;
    return canvasHeight / height;
}

const ImageCanvasOutputClient = ({ assetId, dgid, timestamp, imageSrc }) => {
    const containerRef = useRef();
    const labelCanvas = useRef();
    const img = useRef();
    const [listenerAttached, setListenerAttached] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [canvasDims, setCanvasDims] = useState({ w: 400, h: 300 });

    const {
        annotations,
        dimensions,
        score,
        labels,
        hiddenLabels,
    } = useLabels({ assetId, timestamp, dgid });

    const { settings, isGroup } = useContext(CanvasContext);

    const isVertical = useMemo(() => dimensions?.height > dimensions?.width, [dimensions]);

    const zoom = useMemo(() => Math.max(settings?.zoom ?? 1, 1), [settings?.zoom]);
    const smooth = useMemo(() => settings?.smooth ?? true, [settings?.smooth]);
    const gray = useMemo(() => settings?.gray ?? false, [settings?.gray]);

    const imageScale = useMemo(() => {
        if (!loaded) return 1;

        return computeScale(
                isGroup ? labelCanvas.current.width : isVertical ? 400 * zoom : 300 * zoom,
                isGroup ? labelCanvas.current.height : 300 * zoom,
                img.current.naturalWidth,
                img.current.naturalHeight
        );
    }, [settings?.zoom, isVertical, loaded, zoom, isGroup]);

    const drawLabels = useCallback((w, h) => {
        if (labels) {
            const ctx = labelCanvas.current.getContext("2d");
            ctx.clearRect(0, 0, w, h);
            for (let reg = 0; reg < labels.length; reg++) {
                if (labels[reg]?.score) {
                    if (annotations[reg]?.score < score) continue;
                }
                if (!!labels[reg]?.points) {
                    const points = labels[reg].points;
                    if (!hiddenLabels?.[labels[reg].label]) {
                        for (let r = 0; r < points.length; r++) {
                            const region = points[r];
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

    // This observer updates the canvasDims variable anytime the image resizes,
    // triggering a cascade of side effects that draw the labels at correct scale
    const onLoad = useCallback((e) => {
        const resizeObserver = new ResizeObserver((entries) => {
            const image = entries[0]?.contentRect;
            setCanvasDims({
                w: image.width,
                h: image.height
            })
        });
        resizeObserver.observe(img.current);
        setListenerAttached(true)

        setLoaded(true);
    }, []);

    // Update our label and container divs when we change dimensions
    // Should be triggered initially by onLoad
    useEffect(() => {
        if (loaded) {
            labelCanvas.current.width = canvasDims.w;
            labelCanvas.current.height = canvasDims.h;
            containerRef.current.style.width = `${canvasDims.w}px`;
            containerRef.current.style.height = `${canvasDims.h + 4}px`;
        }
    }, [canvasDims, loaded])


    // Update our image for zoom, if in single view
    useEffect(() => {
        if (listenerAttached && loaded && !isGroup) {
            img.current.height = img.current.naturalHeight * imageScale;
            img.current.width = img.current.naturalWidth * imageScale;
        }
    }, [imageScale, listenerAttached, loaded, isGroup]);

    // Draw our labels anytime we update the dimensions, assuming we've attached our listeners
    useEffect(() => {
        if (loaded && listenerAttached) {
            drawLabels(canvasDims.w, canvasDims.h);
        }
    }, [loaded, listenerAttached, drawLabels, canvasDims.h, canvasDims.w])

    return (
        <div className={cx('canvas-container', { vertical: isGroup && isVertical })} ref={containerRef}>
            <canvas 
                className={cx(['output', 'canvas'], { vertical: isGroup && isVertical })} ref={labelCanvas}
                height={canvasDims.h}
                width={canvasDims.w}
            />
            <img
                className={cx(['output', 'image'], { vertical: isGroup && isVertical, pixelated: !smooth, grayscale: gray })}
                ref={img} src={imageSrc}
                loading="lazy"
                onLoad={onLoad}
            />
        </div>
    )

}

export default ImageCanvasOutputClient;


// for dev, add this to <canvas> title={`asset: ${assetId} imscale: ${imageScale} cd: ${labelCanvas.current?.height} x ${labelCanvas.current?.width} id: ${img.current?.height} x ${img.current?.width}`} 

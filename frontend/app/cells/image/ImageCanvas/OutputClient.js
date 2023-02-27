'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext, useLayoutEffect } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor } from '../../../../lib/generateChartColor';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);


const ImageCanvasOutputClient = ({ assetId, dgid, timestamp, imageSrc }) => {
    const containerRef = useRef();
    const labelCanvas = useRef();
    const img = useRef();
    const [listenerAttached, setListenerAttached] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const {
        annotations,
        dimensions,
        score,
        labels,
        hiddenLabels,
    } = useLabels({ assetId, timestamp, dgid });

    const { settings, isGroup } = useContext(CanvasContext);
    const zoom = useMemo(() => {
        if (isGroup) return 1;
        else return Math.max(settings?.zoom ?? 1, 1)
    }, [settings?.zoom]);
    const smooth = useMemo(() => settings?.smooth ?? true, [settings?.smooth]);
    const gray = useMemo(() => settings?.gray ?? false, [settings?.gray]);


    const isVertical = useMemo(() => dimensions?.height > dimensions?.width, [dimensions]);
    const imageScale = useMemo(() => {
        if (!loaded) return 1;

        if (isVertical) {
            return ( 400 / dimensions?.height ) *( zoom ?? 1)
        }
        else {
            return ( 400 / dimensions?.width * ( zoom ?? 1 ) )
        }
    }, [settings?.zoom, isVertical, loaded, zoom, isGroup]);


    const imgDims = useMemo(() => {
        return {
            height: dimensions.height * imageScale,
            width: dimensions.width * imageScale
        }
    }, [dimensions, imageScale])

    const drawLabels = useCallback(() => {
        if (labels) {
            const ctx = labelCanvas.current.getContext("2d");
            ctx.clearRect(0, 0, imgDims.width, imgDims.height);
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
    }, [imageScale, score, hiddenLabels, labels, imgDims]);

    // This observer updates the canvasDims variable anytime the image resizes,
    // triggering a cascade of side effects that draw the labels at correct scale


    /*
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
            img.current.height = dimensions.height * imageScale;
            img.current.width = dimensions.width * imageScale;
        }
    }, [imageScale, listenerAttached, loaded, isGroup]);*/

    useEffect(() => {
        if (loaded) {
            labelCanvas.current.width = imgDims.width;
            labelCanvas.current.height = imgDims.height;
            containerRef.current.style.width = `${imgDims.width}px`;
            containerRef.current.style.height = `${imgDims.height + 4}px`;
        }
    }, [imgDims])

    // Draw our labels anytime we update the dimensions, assuming we've attached our listeners
    useEffect(() => {
        if (loaded) {
            drawLabels();
        }
    }, [loaded, listenerAttached, drawLabels])


    const onLoad = useCallback(() => setLoaded(true), []);
    return (
        <div className={cx('canvas-container', { vertical: isVertical, horizontal: !isVertical })} ref={containerRef}>
            <canvas 
                className={cx(['output', 'canvas'], { vertical: isVertical, horizontal: !isVertical })} ref={labelCanvas}
            />
            <img
                className={cx(
                    ['output', 'image'], 
                    { 
                        vertical: isVertical,
                        horizontal: !isVertical,
                        pixelated: !smooth,
                        grayscale: gray 
                    }
                )}
                ref={img} 
                src={imageSrc}
                loading="lazy"
                height={imgDims?.height}
                width={imgDims?.width}
                onLoad={onLoad}
            />
        </div>
    )

}

export default ImageCanvasOutputClient;


// for dev, add this to <canvas> title={`asset: ${assetId} imscale: ${imageScale} cd: ${labelCanvas.current?.height} x ${labelCanvas.current?.width} id: ${img.current?.height} x ${img.current?.width}`} 

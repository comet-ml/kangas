'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext, useLayoutEffect } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor, getContrastingColor } from '../../../../lib/generateChartColor';
import truncateValue from '../../../../lib/truncateValue';
import { processMask, drawMarker } from '../../../../lib/canvas';
import { isTagHidden, makeTag } from '../../../../lib/tags';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);


const ImageCanvasOutputClient = ({ assetId, dgid, timestamp, imageSrc }) => {
    const containerRef = useRef();
    const labelCanvas = useRef();
    const img = useRef();
    const [isLoaded, setIsLoaded] = useState(false);

    const {
	    layers,
        score,
        hiddenLabels,
    } = useLabels({ assetId, timestamp, dgid });

    const [dimensions, setDimensions] = useState({ height: 400, width: 400 });
    const { settings, isGroup } = useContext(CanvasContext);

    const zoom = useMemo(() => {
        if (isGroup) return 1;
        else return Math.max(settings?.zoom ?? 1, 1);
    }, [settings?.zoom]);

    const smooth = useMemo(() => settings?.smooth ?? true, [settings?.smooth]);
    const gray = useMemo(() => settings?.gray ?? false, [settings?.gray]);

    const isVertical = useMemo(() => dimensions?.height > dimensions?.width, [dimensions]);
    const imageScale = useMemo(() => {
        if (!isLoaded) return 1;

        if (isVertical) {
            return ( 400 / dimensions?.height ) * ( zoom ?? 1 );
        }
        else {
            return ( 400 / dimensions?.width ) * ( zoom ?? 1 );
        }
    }, [settings?.zoom, isVertical, isLoaded, zoom, isGroup, dimensions]);


    const imgDims = useMemo(() => {
        return {
            height: Math.round( dimensions.height * imageScale ) || 400,
            width: Math.round( dimensions.width * imageScale ) || 400
        };
    }, [dimensions, imageScale]);


    const drawLabels = useCallback(() => {
        if (layers) {
            const alpha = 200; // get from slider?
            const ctx = labelCanvas.current.getContext("2d");
            ctx.font = "1em serif";
            ctx.textBaseline = "bottom";
            ctx.clearRect(0, 0, imgDims.width, imgDims.height);
            // Display any masks first:
	    for (let layer of layers) {
            for (let annotation of layer?.data) {
                if (annotation.mask) {
                    console.log("drawing mask!");
                    processMask(ctx, annotation, imgDims, hiddenLabels, layer.name, score, alpha);
                }
            }
	    }
        // Next, draw all other annotations:
	    for (let layer of layers) {
	        for (let annotation of layer?.data) {
                if (annotation.score && annotation.score <= score) continue;
                if (!!annotation.points) {
                    const points = annotation.points;
                    if (!isTagHidden(hiddenLabels, makeTag(hiddenLabels, layer.name, annotation.label))) {
                        for (let r = 0; r < points.length; r++) {
                            const region = points[r];
                            ctx.fillStyle = getColor(
                                annotation.label
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
                } else if (!!annotation.boxes) {
                    const boxes = annotation.boxes;
                    if (!isTagHidden(hiddenLabels, makeTag(layer.name, annotation.label))) {
                        for (let r = 0; r < boxes.length; r++) {
                            const [x1, y1, x2, y2] = boxes[r];
                            ctx.strokeStyle = getColor(
                                annotation.label
                            );
                            if (r === 0) {
                                let text = null;

                                if (typeof annotation.score !== null) {
                                    text = `${annotation.label}: ${truncateValue(annotation.score)}`;
                                } else {
                                    text = `${annotation.label}`;
                                }

                                const fontMetrics = ctx.measureText(text);
                                const startX = x1 * imageScale - 1;
                                const startY = y1 * imageScale;
                                const border = 5;
                                const width = fontMetrics.width + border * 2;
                                const height = fontMetrics.fontBoundingBoxAscent + fontMetrics.fontBoundingBoxDescent + border * 2;

                                // Draw text background box
                                ctx.fillStyle = ctx.strokeStyle;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(startX, startY);
                                ctx.lineTo( startX, startY - height);
                                ctx.lineTo( startX + width, startY - height);
                                ctx.lineTo( startX + width, startY);
                                ctx.closePath();
                                ctx.fill();

                                // Draw the label:
                                ctx.fillStyle = getContrastingColor(ctx.strokeStyle);
                                ctx.fillText(text, startX + border, startY - border);
                            }
                            // Draw the bounding box
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
                } else if (annotation.lines) {
                    const lines = annotation.lines;
                    if (!isTagHidden(hiddenLabels, makeTag(layer.name, annotation.label))) {
                        for (let r = 0; r < lines.length; r++) {
                            const [x1, y1, x2, y2] = lines[r];
                            ctx.strokeStyle = getColor(
                                annotation.label
                            );
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(x1 * imageScale, y1 * imageScale);
                            ctx.lineTo(x2 * imageScale, y2 * imageScale);
                            ctx.stroke();
                        }
                    }
                } else if (annotation.markers) {
                    const markers = annotation.markers;
                    let marker = null;
                    if (!isTagHidden(hiddenLabels, makeTag(layer.name, annotation.label))) {
                        for (let r = 0; r < markers.length; r++) {
                            const marker = markers[r];
                            marker.color = getColor(
                                annotation.label
                            );
                            drawMarker(ctx, marker, marker.x * imageScale, marker.y * imageScale);
                        }
                    }
                } else if (annotation.mask) {
                    // skip here; already drawn
                } else {
                    console.log(`unknown annotation type: ${annotation}`);
                }
             }
	    }
        }
    }, [imageScale, score, hiddenLabels, layers, imgDims]);


    const onLoad = useCallback((e) => {
        setDimensions({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
        });

        setIsLoaded(true);
    }, []);


    useEffect(() => {
        if (isLoaded) {
            labelCanvas.current.width = imgDims.width;
            labelCanvas.current.height = imgDims.height;

            containerRef.current.style.width = `${imgDims.width}px`;
            containerRef.current.style.height = `${imgDims.height}px`;
        }
    }, [imgDims, isGroup, isVertical])

    useEffect(() => {
        if (isLoaded) {
            drawLabels();
        }
    }, [isLoaded, drawLabels]);


    return (
        <div
            className={cx(
                'canvas-container',
                {
                    vertical: isVertical,
                    horizontal: !isVertical,
                    grouped: isGroup
                })
            }
            ref={containerRef}
        >
            <canvas
                className={
                    cx(
                        ['output', 'canvas'],
                        {
                            vertical: isVertical,
                            horizontal: !isVertical,
                            single: !isGroup
                        })
                }
                ref={labelCanvas}
            />
            <img
                className={cx(
                    ['output', 'image'],
                    {
                        vertical: isVertical,
                        horizontal: !isVertical,
                        pixelated: !smooth,
                        grayscale: gray,
                        single: !isGroup
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

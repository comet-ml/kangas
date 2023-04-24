'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext, useLayoutEffect } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor, getContrastingColor } from '../../../../lib/generateChartColor';
import truncateValue from '../../../../lib/truncateValue';
import { drawRegions, drawBoxes, drawLines, drawMask, drawMarkers } from '../../../../lib/canvas';
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


    const drawAllAnnotations = useCallback(() => {
        if (layers) {
	    // Globals:
            const alpha = 200; // get from slider?
            const ctx = labelCanvas.current.getContext("2d");
            ctx.font = "1em serif";
            ctx.textBaseline = "bottom";
            ctx.clearRect(0, 0, imgDims.width, imgDims.height);

            // Display any masks first:
            for (let layer of layers) {
                for (let annotation of layer?.data) {
                    if (annotation.mask) {
                        drawMask(ctx, annotation, imgDims, hiddenLabels, layer.name, score, alpha);
                    }
                }
            }
            // Next, draw all other annotations:
            for (let layer of layers) {
                for (let annotation of layer?.data) {
                    if (annotation.score && annotation.score <= score)
			continue;

                    if (!!annotation.points) {
			drawRegions(ctx, annotation.points, layer.name, annotation.label, imageScale, hiddenLabels);
                    } else if (!!annotation.boxes) {
			drawBoxes(ctx, annotation.boxes, layer.name, annotation.label, annotation.score, imageScale, hiddenLabels);
                    } else if (annotation.lines) {
			drawLines(ctx, annotation.lines, layer.name, annotation.label, imageScale, hiddenLabels);
                    } else if (annotation.markers) {
			drawMarkers(ctx, annotation.markers, layer.name, annotation.label, imageScale, hiddenLabels);
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
            drawAllAnnotations();
        }
    }, [isLoaded, drawAllAnnotations]);


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

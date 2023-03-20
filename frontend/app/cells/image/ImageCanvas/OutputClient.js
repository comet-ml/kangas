'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext, useLayoutEffect } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor, getContrastingColor, hexToRgb } from '../../../../lib/generateChartColor';
import { createColormap } from '../../../../lib/createColormap';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);


const drawMarker = function(ctx, marker, x, y) {
    if (marker.shape === "circle") {
        drawCircle(ctx, marker, x, y);
    } else if (marker.shape === "raindrop") {
        drawRaindrop(ctx, marker, x, y);
    } else {
        console.log(`unknown shape ${marker.shape}`);
    }
};

const drawCircle = function(ctx, marker, x, y) {
    ctx.fillStyle = marker.color;
    ctx.lineWidth = marker.borderWidth;
    ctx.beginPath();
    ctx.arc(x, y, marker.size/2, 0, Math.PI * 2);
    ctx.fill();
};

const drawRaindrop = function(ctx, marker, x, y) {
    marker.width = marker.size;
    marker.height = marker.size * 1.5;
    marker.contrastingColor = getContrastingColor(marker.color);

    // Move the drawing routine to make x,y be centered
    // on point:
    y -= marker.height;
    x -= marker.width / 2;

    ctx.lineWidth = 1.2;
    rainDrop(ctx, x + 1, y + 1, marker.width, marker.height, marker.contrastingColor, false);
    rainDrop(ctx, x, y, marker.width, marker.height, marker.color, false);

    // Highlight area
    ctx.beginPath();
    const highlight = {
        color: marker.contrastingColor,
        width: marker.width / 4,
        x: x + marker.width / 2,
        y: y + (marker.height / 3)
    };
    ctx.arc(highlight.x, highlight.y, highlight.width / 2, Math.PI * 2, 0, false);
    ctx.fillStyle = highlight.color;
    ctx.fill();
};


const rainDrop = function(ctx, x, y, width, height, fill, stroke) {
    // Center points
    const center = {
	x: x + width/2,
        y: y + height/2
    };
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Top arc
    ctx.beginPath();
    ctx.arc(center.x, y + height/3, width/2, Math.PI, 0, false);

    // Right bend
    ctx.bezierCurveTo(
        x + width,
        y + (height/3) + height/4,
        center.x + width/3,
        center.y,
        center.x,
        y + height
    );

    // Left bend
    ctx.moveTo(x, y + height/3);
    ctx.bezierCurveTo(
        x,
        y + (height/3) + height/4,
        center.x - width/3,
        center.y,
        center.x,
        y + height
    );

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }

    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }
};


const ImageCanvasOutputClient = ({ assetId, dgid, timestamp, imageSrc }) => {
    const containerRef = useRef();
    const labelCanvas = useRef();
    const img = useRef();
    const [loaded, setLoaded] = useState(false);

    const {
        annotations,
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
        if (!loaded) return 1;

        if (isVertical) {
            return ( 400 / dimensions?.height ) * ( zoom ?? 1 );
        }
        else {
            return ( 400 / dimensions?.width ) * ( zoom ?? 1 );
        }
    }, [settings?.zoom, isVertical, loaded, zoom, isGroup, dimensions]);


    const imgDims = useMemo(() => {
        return {
            height: Math.round( dimensions.height * imageScale ) || 400,
            width: Math.round( dimensions.width * imageScale ) || 400
        };
    }, [dimensions, imageScale]);


    const drawLabels = useCallback(() => {
        if (annotations?.data) {
	    const alpha = 255; // get from slider?
            const ctx = labelCanvas.current.getContext("2d");
            ctx.clearRect(0, 0, imgDims.width, imgDims.height);
            // Display any masks first:
            for (let annotation of annotations.data) {
                if (annotation.mask) {
                    processMask(ctx, annotation, imgDims, hiddenLabels, score, alpha);
                }
            }
            // Next, draw all other annotations:
            for (let annotation of annotations.data) {
                if (annotation.score && annotation.score <= score)
		    continue;
                if (!!annotation.points) {
                    const points = annotation.points;
                    if (!hiddenLabels?.[annotation.label]) {
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
                    if (!hiddenLabels?.[annotation.label]) {
                        for (let r = 0; r < boxes.length; r++) {
                            const [x1, y1, x2, y2] = boxes[r];
                            ctx.strokeStyle = getColor(
                                annotation.label
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
                } else if (annotation.lines) {
                    const lines = annotation.lines;
                    if (!hiddenLabels?.[annotation.label]) {
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
                    if (!hiddenLabels?.[annotation.label]) {
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
    }, [imageScale, score, hiddenLabels, annotations, imgDims]);


    const processMask = function(ctx, annotation, imgDims, hiddenLabels, score, alpha) {
	const mask = annotation.mask;
	if (mask.type === "segmentation") {
	    processSegmentationMask(ctx, mask, imgDims, hiddenLabels, annotation.scores, score, alpha);
	} else if (mask.type === "metric") {
	    if (annotation.label && hiddenLabels?.[annotation.label]) {
		// pass, hidden label
	    } else if (annotation.score && annotation.score <= score) {
		// skip it, score not high enough
	    } else {
		processMetricMask(ctx, mask, imgDims, alpha);
	    }
	}
    };

    const processSegmentationMask = function(ctx, mask, imgDims, hiddenLabels, scores, score, alpha) {
        const image = makeSegmentationMaskImage(mask, hiddenLabels, scores, score, alpha);

	// Scale the mask to fit the size of the scaled image:
        const canvas = new OffscreenCanvas(mask.width, mask.height);
        const context = canvas.getContext("2d");
        context.putImageData(image, 0, 0);
        ctx.drawImage(canvas, 0, 0, imgDims.width, imgDims.height);
    };

    const makeSegmentationMaskImage = function(mask, hiddenLabels, scores, score, alpha) {
        const buffer = new Uint8ClampedArray(mask.width * mask.height * 4);

	if (mask.format === 'rle') {
	    mask.array = rleDecode(mask.array, mask.width, mask.height);
	    mask.format = "raw";
	}

        for (let y = 0; y < mask.height; y++) {
            for (let x = 0; x < mask.width; x++) {
                const classCode = mask.array[y * mask.width + x];
                const label = mask.map[classCode];
		// Not hidden by label click:
                if (label && !hiddenLabels?.[label]) {
		    // Not hidden due to score slider:
		    if (scores && scores[label] && scores[label] <= score)
			continue;

		    let pos = (y * mask.width + x) * 4;
		    const rgb = hexToRgb(getColor(label));
		    buffer[pos  ] = rgb[0];
		    buffer[pos+1] = rgb[1];
		    buffer[pos+2] = rgb[2];
		    buffer[pos+3] = alpha;
		}
            }
        }
        return new ImageData(buffer, mask.width, mask.height); // settings can be colorSpace name
    };

    const processMetricMask = function(ctx, mask, imgDims, alpha) {
        const image = makeMetricMaskImage(mask, alpha);

	// Scale the mask to fit the size of the scaled image:
        const canvas = new OffscreenCanvas(mask.width, mask.height);
        const context = canvas.getContext("2d");
        context.putImageData(image, 0, 0);
        ctx.drawImage(canvas, 0, 0, imgDims.width, imgDims.height);
    }

    const makeMetricMaskImage = function(mask, alpha) {
        const buffer = new Uint8ClampedArray(mask.width * mask.height * 4);

	if (mask.format === 'rle') {
	    mask.array = rleDecode(mask.array, mask.width, mask.height);
	    mask.format = "raw";
	}

	const colorMap = createColormap({
	    colormap: mask.colormap,
	    nshades: 256,
	    format: 'rgba',
	    alpha: 0.5
	});

        for (let y = 0; y < mask.height; y++) {
            for (let x = 0; x < mask.width; x++) {
		const pos = (y * mask.width + x) * 4;
		// Convert back to float:
                const value = mask.array[y * mask.width + x];
		if (value > 0) {
		    // Show metric with some transparency
		    const rgba = colorMap[value]
		    buffer[pos  ] = rgba[0];
		    buffer[pos+1] = rgba[1];
		    buffer[pos+2] = rgba[2];
		    buffer[pos+3] = 200; // FIXME: get alpha from a control
		} else {
		    // Black out where there is no metric:
		    buffer[pos  ] = 0;
		    buffer[pos+1] = 0;
		    buffer[pos+2] = 0;
		    buffer[pos+3] = 255; // FIXME: get alpha from a control
		}
            }
        }
        return new ImageData(buffer, mask.width, mask.height); // settings can be colorSpace name
    };

    const rleDecode = function(encoding, width, height) {
	const sequence = new Array(width * height);
	let index = 0;
	for (let i=0; i < encoding.length; i+=2) {
	    const value = encoding[i];
	    const count = encoding[i+1];
	    for (let c=0; c < count; c++) {
		sequence[index++] = value;
	    }
	}
	return sequence;
    }

    const onLoad = useCallback((e) => {
        setDimensions({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
        });
        setLoaded(true);
    }, []);


    useEffect(() => {
        if (loaded) {
            labelCanvas.current.width = imgDims.width;
            labelCanvas.current.height = imgDims.height;
            containerRef.current.style.width = `${imgDims.width}px`;
            containerRef.current.style.height = `${imgDims.height}px`;
        }
    }, [imgDims]);

    useEffect(() => {
        if (loaded) {
            drawLabels();
        }
    }, [loaded, drawLabels]);

    return (
        <div className={cx('canvas-container', { vertical: isVertical, horizontal: !isVertical, grouped: isGroup })} ref={containerRef}>
            <canvas
                className={cx(['output', 'canvas'], { vertical: isVertical, horizontal: !isVertical, single: !isGroup })} ref={labelCanvas}
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

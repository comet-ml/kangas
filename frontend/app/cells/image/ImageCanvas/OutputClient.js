'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext, useLayoutEffect } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import { getColor } from '../../../../lib/generateChartColor';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);


const drawMarker = function(ctx, marker) {
    marker.width = marker.size;
    marker.height = marker.size * 1.5;

    /*
    const redGradient = ctx.createLinearGradient(marker.x, marker.y, marker.x + marker.width, marker.y + marker.height);
    redGradient.addColorStop( 0, '#d00');
    redGradient.addColorStop( 1, '#600');

    const darkRedGradient = ctx.createLinearGradient(marker.x, marker.y, marker.x + marker.width, marker.y + marker.height);
    darkRedGradient.addColorStop(0, '#800');
    darkRedGradient.addColorStop(1, '#500');
    */

    // Dark background gradient (initial raindrop "border")
    ctx.lineWidth = 1.2;
    //rainDrop(ctx, marker.x, marker.y, marker.width, marker.height, redGradient, darkRedGradient);
    rainDrop(ctx, marker.x, marker.y, marker.width, marker.height, marker.color, false);

    // border
    const highlightThickness = (marker.width / 99.0) * marker.borderWidth;
    const highlight = {
        x: marker.x + 1.5,
        y: marker.y,
        width: marker.width - 2.5,
        height: marker.height - highlightThickness * 2.5
    };
    rainDrop(ctx, highlight.x, highlight.y, highlight.width, highlight.height, marker.color, false);

    // Inner gradient
    const inner = {
        x: highlight.x,
        y: highlight.y + 1.5,
        width: highlight.width,
        height: highlight.height - highlightThickness
    };
    rainDrop(ctx, inner.x, inner.y, inner.width, inner.height, marker.color, false); // redGradient

    // Small white ball
    ctx.closePath()
    ctx.beginPath()
    const whiteBall = {
        color: '#fff',
        border: '#800',
        width: marker.width / 4,
        height: marker.width / 4,
        x: marker.x + marker.width / 2,
        y: marker.y + (marker.height / 3)
    };
    ctx.arc(whiteBall.x, whiteBall.y, whiteBall.width / 2, Math.PI * 2, 0, false);
    ctx.fillStyle = whiteBall.color;
    ctx.fill();
}

const rainDrop = function(ctx, x, y, width, height, fill, stroke) {
    // Center points
    const center = {
	x: x + width/2,
        y: y + height/2
    };
    ctx.beginPath();
    // Shadow is one 6th of the width and one 8th of the height
    const shadow = {
        width:  width / 2,
        height: width / 2
    };
    shadow.start = {
        x: center.x - shadow.width / 2,
        y: y + height - shadow.height
    };
    const shadowGradient = ctx.createRadialGradient(
        shadow.start.x + shadow.width/2,
        shadow.start.y + shadow.height/2,
        0,
        shadow.start.x + shadow.width/2,
        shadow.start.y + shadow.height/2,
        shadow.width / 2
    );
    shadowGradient.addColorStop(0, 'rgba(0,0,0,.3)');
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.setTransform(1, 0, 0, 0.5, 0, 0);
    ctx.translate(0, y + height + shadow.height/2);
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(shadow.start.x, shadow.start.y, shadow.width, shadow.height);
    ctx.fill();
    ctx.closePath();
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
        labels,
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
            height: ( dimensions.height * imageScale ) || 400,
            width: ( dimensions.width * imageScale ) || 400
        };
    }, [dimensions, imageScale]);


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
                } else if (labels[reg]?.lines) {
                    const lines = labels[reg].lines;
                    if (!hiddenLabels?.[labels[reg]?.label]) {
                        for (let r = 0; r < lines.length; r++) {
                            const [x1, y1, x2, y2] = lines[r];
                            ctx.strokeStyle = getColor(
                                labels[reg].label
                            );
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(x1 * imageScale, y1 * imageScale);
                            ctx.lineTo(x2 * imageScale, y2 * imageScale);
                            ctx.stroke();
                        }
                    }
                } else if (labels[reg]?.locations) {
                    const locations = labels[reg].locations;
                    if (!hiddenLabels?.[labels[reg]?.label]) {
                        for (let r = 0; r < locations.length; r++) {
                            const [x, y] = locations[r];
			    const markerType = "raindrop";
			    if (markerType === "circle") {
				ctx.fillStyle = getColor(
                                    labels[reg].label
				);
				const radius = 3;
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(x * imageScale, y * imageScale, radius, 0, Math.PI);
				ctx.fill();
                            } else if (markerType === "raindrop") {
				const marker = {
				    size: 24, // based on image size?
				    x: x * imageScale,
				    y: y * imageScale,
				    borderWidth: 1.5,
				    color: getColor(
					labels[reg].label
				    ),
				};
				drawMarker(ctx, marker);
			    }
			}
                    }
                } else if (labels[reg]?.mask) {
                    //const image = new Image();
                    //ctx.globalAlpha = 0.5;
                    //ctx.drawImage(image, 0, 0, imgDims.width, imgDims.height);
                    const mask = makeMask(imgDims.width, imgDims.height, 128); // alpha
                    ctx.putImageData(mask);
                } else {
		    console.log(`unknown annotation type: ${labels[reg]}`);
		}
            }
        }
    }, [imageScale, score, hiddenLabels, labels, imgDims]);

    const makeMask = function(width, height, alpha) {
        const buffer = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x > 100 && x < 200 && y > 100 && y < 200) {
                    let pos = (y * width + x) * 4; // position in buffer based on x and y
                    buffer[pos  ] = 255;           // some R value [0, 255]
                    //buffer[pos+1] = ...;           // some G value
                    //buffer[pos+2] = ...;           // some B value
                    buffer[pos+3] = alpha;           // set alpha channel
                }
            }
        }
        return ImageData(buffer, width, height); // settings can be colorSpace name
    };

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

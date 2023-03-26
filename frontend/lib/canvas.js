import { getContrastingColor, hexToRgb, getColor } from "./generateChartColor";
import { createColormap } from './createColormap';
import { isTagHidden, makeTag } from './tags';

const drawMarker = (ctx, marker, x, y) => {
    if (marker.shape === "circle") {
        drawCircle(ctx, marker, x, y);
    } else if (marker.shape === "raindrop") {
        drawRaindrop(ctx, marker, x, y);
    } else {
        console.log(`unknown shape ${marker.shape}`);
    }
};

const drawCircle = (ctx, marker, x, y) => {
    ctx.fillStyle = marker.color;
    ctx.lineWidth = marker.borderWidth;
    ctx.beginPath();
    ctx.arc(x, y, marker.size/2, 0, Math.PI * 2);
    ctx.fill();
};

const drawRaindrop = (ctx, marker, x, y) => {
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


const rainDrop = (ctx, x, y, width, height, fill, stroke)  => {
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


const processMask = (ctx, annotation, imgDims, hiddenLabels, layerName, score, alpha) => {
    const mask = annotation.mask;
    if (mask.type === "segmentation") {
        processSegmentationMask(ctx, mask, imgDims, hiddenLabels, layerName, annotation.scores, score, alpha);
    } else if (mask.type === "metric") {
        if (isTagHidden(hiddenLabels, makeTag(layerName, annotation.label))) {
            // pass, hidden label
        } else if (annotation.score && annotation.score <= score) {
            // skip it, score not high enough
        } else {
            processMetricMask(ctx, mask, imgDims, alpha);
        }
    }
};


const makeSegmentationMaskImage = (mask, hiddenLabels, layerName, scores, score, alpha) => {
    const buffer = new Uint8ClampedArray(mask.width * mask.height * 4);

    if (mask.format === 'rle') {
        mask.array = rleDecode(mask.array, mask.width, mask.height);
        mask.format = "raw";
    }

    // Get colors and hidden status for labels first:
    const rgbMap = Object.values(mask.map).reduce(
	(accum, label) => (
	    {
		...accum, [label]: hexToRgb(
		    getColor(layerName === '(uncategorized)' ? label : makeTag(layerName, label)))
	    }
	), {});
    const hiddenMap = Object.values(mask.map).reduce(
	(accum, label) => (
	    {
		...accum, [label]: isTagHidden(hiddenLabels, makeTag(layerName, label))
	    }
	), {});

    for (let y = 0; y < mask.height; y++) {
        for (let x = 0; x < mask.width; x++) {
            const classCode = mask.array[y * mask.width + x];
            const label = mask.map[classCode];
            // Not hidden by label click:
            if (label && !hiddenMap[label]) {
                // Not hidden due to score slider:
                if (scores && scores[label] && scores[label] <= score)
                    continue;
                let pos = (y * mask.width + x) * 4;
		const rgb = rgbMap[label];
                buffer[pos  ] = rgb[0];
                buffer[pos+1] = rgb[1];
                buffer[pos+2] = rgb[2];
                buffer[pos+3] = alpha;
            }
        }
    }
    return new ImageData(buffer, mask.width, mask.height); // settings can be colorSpace name
};

const processMetricMask = (ctx, mask, imgDims, alpha) => {
    const image = makeMetricMaskImage(mask, alpha);

// Scale the mask to fit the size of the scaled image:
    const canvas = new OffscreenCanvas(mask.width, mask.height);
    const context = canvas.getContext("2d");
    context.putImageData(image, 0, 0);
    ctx.drawImage(canvas, 0, 0, imgDims.width, imgDims.height);
}

const makeMetricMaskImage = (mask, alpha) => {
    const buffer = new Uint8ClampedArray(mask.width * mask.height * 4);

    if (mask.format === 'rle') {
        mask.array = rleDecode(mask.array, mask.width, mask.height);
        mask.format = "raw";
    }

    // if colorlevels is missing, using old default of 255
    const colorMap = createColormap({
        colormap: mask.colormap,
        nshades: mask?.colorlevels || 255,
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
                // transparent
                buffer[pos  ] = 0;
                buffer[pos+1] = 0;
                buffer[pos+2] = 0;
                buffer[pos+3] = 0; // FIXME: get alpha from a control
            }
        }
    }
    return new ImageData(buffer, mask.width, mask.height); // settings can be colorSpace name
};

const rleDecode = (encoding, width, height) => {
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
};

    const processSegmentationMask = (ctx, mask, imgDims, hiddenLabels, layerName, scores, score, alpha) => {
        const image = makeSegmentationMaskImage(mask, hiddenLabels, layerName, scores, score, alpha);

        // Scale the mask to fit the size of the scaled image:
        const canvas = new OffscreenCanvas(mask.width, mask.height);
        const context = canvas.getContext("2d");
        context.putImageData(image, 0, 0);
        ctx.drawImage(canvas, 0, 0, imgDims.width, imgDims.height);
    };


export {
    processSegmentationMask,
    drawMarker,
    drawCircle,
    drawRaindrop,
    rainDrop,
    rleDecode,
    processMask,
    processMetricMask,
    makeMetricMaskImage
}

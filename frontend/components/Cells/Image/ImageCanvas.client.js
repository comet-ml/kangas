/* eslint-disable react/jsx-key */

import {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
    useContext,
    createContext,
    useReducer,
} from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';
import { useDebouncedCallback } from 'use-debounce';

// Config
import { ConfigContext } from '../ClientContext.client';

// Utils

import { getColor } from '../../../lib/generateChartColor';

import Label from './Label.client';
import DialogueModalContainer from '../../Modals/DialogueModalContainer.client';
import CanvasWrapper from './CanvasWrapper.client';
import Canvas from './Canvas.client';
import { StatusTypes } from 'react-async';
/* 

In the below components, we have a potentially confusing distinction between "hidden labels" and "filtered labels".

To clarify, hidden labels are labels that are manually hidden by the user clicking directly on the label. Filtered labels
are instead removed according to their score.

Hidden labels are set at the parent ImageCanvas level, while each canvas individually calculates its filtered labels.

*/

export const CanvasContext = createContext();

const initialState = {
    canvasesRendered: 0,
    canvasesRemaining: 0,
}

const reducer = (state, action) => {
    switch (action.type) {
        case 'render-canvas':
            
            return {
                ...state,
                canvasesRendered: state.canvasesRendered + 1,
                canvasesRemaining: state.canvasesRemaining - 1,
            }
    }
}

// TODO Memoize these props into a canvasProps style object
const CanvasContainer = ({ urls, url, isMulti, strValue, drawImage, assetId, dgid, filterLabels, scoreBound }) => {
    const { ref, inView, entry } = useInView({
        threshold: 0,
        rootMargin: '10000px'
    });


    const increaseVisible = useDebouncedCallback(() => {
        setVisible(Math.min(visible + 100, urls?.length))
    },
    250);

    useEffect(() => {
        if (inView) increaseVisible();
    }, [inView, increaseVisible])

    const [visible, setVisible] = useState(100);

	return (
            <div>
                <h2 className="image-title">{strValue}</h2>
                {urls ? (
                    <div className="canvas-grid">
                        {urls.slice(0, visible).map((x, i) => (
                            <DialogueModalContainer
                                key={x}
                                tabIndex={i}
                                toggleElement={
                                    <CanvasWrapper
                                        url={x}
                                        drawImage={drawImage}
                                        assetId={assetId}
                                        dgid={dgid}
                                        filterLabels={filterLabels}
                                        scoreBound={scoreBound}
                                        index={i}
                                    />
                                }
                            >
                                <ImageCanvas
                                    url={x}
                                    dgid={dgid}
                                    assetId={assetId}
                                />
                            </DialogueModalContainer>
                        ))}
                        <div style={{ width: '100%' }} ref={ref} />
                    </div>
                ) : (
                    <Canvas
                        url={url}
                        drawImage={drawImage}
                        assetId={assetId}
                        dgid={dgid}
                        scoreBound={scoreBound}
                    />
                )}
            </div>
	)
}

// TODO Simplify this component + move subcomponents/lib functions out

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

const Accordion = ({ label, children }) => {
    const [active, setActive] = useState(false);
    const toggleActive = useCallback(() => {
        setActive(!active);
    }, [active]);

    return (
        <div className="accordion">
            <div className="accordion-label" onClick={toggleActive}>
                <div className="arrow" />
                {label}
            </div>
            <div className={`accordion-content ${active ? 'active' : ''}`}>
                {children}
            </div>
        </div>
    );
};


const ImageCanvas = ({ url, metadata, dgid, assetId, urls }) => {
    // This is the full image, not thumbnail
    const appConfig = useContext(ConfigContext);
    const [mask] = useState();
    const [smootheImage, setSmootheImage] = useState(true);
    const [grayscale, setGrayscale] = useState(false);
    const [invert] = useState(false);
    const [imageAlpha] = useState(1.0);
    const [overlayAlpha] = useState(1.0);
    const [parsedMeta, setParsedMeta] = useState();
    const [scoreRange, setScoreRange] = useState({ min: 0, max: 1 });
    const [scoreBound, setScoreBound] = useState();

    const [hiddenLabels, setHiddenLabels] = useState(new Set());
    const [canvasWidth, canvasHeight] = [400, 400];
    const [canvasScale, setCanvasScale] = useState(1.0);
    const isMulti = useMemo(() => !!urls?.length, [urls]);

    const scoreRef = useRef();

    const clientFetchMeta = useCallback(async () => {
        if (metadata) return;

        const res = await fetch(`/api/metadata?${new URLSearchParams({
                assetId: assetId || new URL(url).searchParams.get('assetId'),
                dgid,
                url: `../4001/asset-metadata`,
            }).toString()}`
        );
        const parsed = await res.json();
        setParsedMeta(JSON.parse(parsed));
    }, [appConfig?.apiProxyUrl, assetId, dgid, metadata, url]);

	// If metadata is passed in as a prop, we use it to set parsedMeta.
	// If not, we fetch the metadata on the clientside 
    useEffect(() => {
        if (metadata) {
            const parsed = JSON.parse(metadata);
            if (parsed) {
                setParsedMeta(parsed);
            }
        } else {
            clientFetchMeta();
        }
    }, [metadata, clientFetchMeta]);

    const updateSmoothing = useCallback((value) => {
        // checkbox is for pixelated, so true means not smoothe:
        setSmootheImage(!value.target.checked);
    }, []);

    const updateGrayscale = useCallback((value) => {
        setGrayscale(value.target.checked);
    }, []);

    const updateCanvasScale = useCallback((value) => {
        setCanvasScale(value.target.value);
    }, []);

    const updateScoreBound = useCallback((value) => {
        setScoreBound(value.target.value);
    }, []);

    useEffect(() => {
        scoreRef.current.min = scoreRange.min;
        scoreRef.current.max = scoreRange.max;
    }, [scoreRange]);

    const filterLabels = useCallback(
        (filtered) => {
            const newLabels = new Set(hiddenLabels);
            filtered?.forEach((label) => {
                if (!newLabels.has(label)) newLabels.add(label);
            });
            setHiddenLabels(newLabels);
        },
        [hiddenLabels]
    );

    const drawImage = useCallback(
        (canvas, image, meta, filtered) => {
            if (!meta) return;

            const ctx = canvas.current.getContext('2d');

            const imageScale = computeScale(
                canvasWidth * canvasScale,
                canvasHeight * canvasScale,
                image.current.naturalWidth,
                image.current.naturalHeight
            );

            canvas.current.width = image.current.naturalWidth * imageScale;
            canvas.current.height = image.current.naturalHeight * imageScale;

            ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
            ctx.globalAlpha = imageAlpha;

            // Handle masks as you draw the image
            if (mask) {
                // Assumes same size as Image:
                ctx.drawImage(
                    mask,
                    0,
                    0,
                    image.current.width * imageScale,
                    image.current.height * imageScale
                );
                ctx.globalCompositeOperation = 'source-in';
                // White is masked area; other will shine through
            }
            // Now draw the image
            ctx.imageSmoothingEnabled = smootheImage;
            ctx.drawImage(
                image.current,
                0,
                0,
                image.current.width * imageScale,
                image.current.height * imageScale
            );

            if (grayscale) {
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.current.width,
                    canvas.current.height
                );
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg; // red
                    data[i + 1] = avg; // green
                    data[i + 2] = avg; // blue
                }
                ctx.putImageData(imageData, 0, 0);
            }

            if (invert) {
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.current.width,
                    canvas.current.height
                );
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i]; // red
                    data[i + 1] = 255 - data[i + 1]; // green
                    data[i + 2] = 255 - data[i + 2]; // blue
                }
                ctx.putImageData(imageData, 0, 0);
            }

            if (meta?.overlays) {
                ctx.globalAlpha = overlayAlpha;
                for (let reg = 0; reg < meta?.overlays.length; reg++) {
                    if (filtered.includes(meta.overlays[reg]?.label)) continue;
                    if (meta.overlays[reg]?.score) {
                        const score = meta.overlays[reg].score;
                        // Update the score range, if appropriate
                        if (scoreRange.min > score)
                            setScoreRange({ ...scoreRange, min: score });
                        if (scoreRange.max < score)
                            setScoreRange({ ...scoreRange, max: score });

                        // Filter labels outside of range. For multi-view, the individual canvas does this
                        if (!isMulti && scoreBound > score)
                            removeLabel(meta.overlays[reg].label);
                    }
                    if (meta?.overlays[reg].type === 'regions') {
                        const regions = meta?.overlays[reg].data;
                        if (!hiddenLabels.has(meta?.overlays[reg].label)) {
                            for (let r = 0; r < regions.length; r++) {
                                const region = regions[r];
                                ctx.fillStyle = getColor(
                                    meta?.overlays[reg].label
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
                    } else if (meta?.overlays[reg].type === 'boxes') {
                        const boxes = meta?.overlays[reg].data;
                        if (!hiddenLabels.has(meta?.overlays[reg].label)) {
                            for (let r = 0; r < boxes.length; r++) {
                                const [[x1, y1], [x2, y2]] = boxes[r];
                                ctx.strokeStyle = getColor(
                                    meta?.overlays[reg].label
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
                    } else if (meta?.overlays[reg].type === 'annotations') {
                        // FIXME: text, anchor, points
                    }
                }
            }
        },
        [
            mask,
            grayscale,
            invert,
            canvasScale,
            hiddenLabels,
            smootheImage,
            removeLabel,
            scoreBound,
            canvasHeight,
            canvasWidth,
            imageAlpha,
            isMulti,
            overlayAlpha,
            scoreRange,
        ]
    );

    const addLabel = useCallback(
        (label) => {
            const newLabels = new Set(hiddenLabels);
            if (newLabels.has(label)) newLabels.delete(label);
            setHiddenLabels(newLabels);
        },
        [hiddenLabels]
    );

    const removeLabel = useCallback(
        (label) => {
            const newLabels = new Set(hiddenLabels);
            if (!newLabels.has(label)) newLabels.add(label);
            setHiddenLabels(newLabels);
        },
        [hiddenLabels]
    );

    const formattedLabels = useMemo(() => {
        if (!parsedMeta?.labels) return null;
        // TODO: Remove when all DGs are updated. Old DGs used a raw array data structure for labels.
        if (Array.isArray(parsedMeta?.labels)) return parsedMeta?.labels.sort();
        return Object.keys(parsedMeta?.labels).sort();
    }, [parsedMeta]);

    const strValue = useMemo(
        () => metadata?.name || metadata?.filename || assetId,
        [metadata, assetId]
    );

    const displayMeta = useMemo(() => {
        if (!parsedMeta || isMulti) return null;
        if (!parsedMeta?.overlays) return parsedMeta;
        const { ...display } = parsedMeta;
        return display;
    }, [parsedMeta, isMulti]);

    useEffect(() => {
        if (parsedMeta?.overlays && !!scoreBound) {
            let newHiddenLabels = new Set(hiddenLabels);
            for (const overlay of parsedMeta?.overlays || {}) {
                if (overlay?.score) {
                    if (overlay?.score <= scoreBound) {
                        newHiddenLabels.add(overlay?.label);
                    }
                    if (
                        overlay?.score > scoreBound &&
                        newHiddenLabels.has(overlay?.label)
                    ) {
                        newHiddenLabels.delete(overlay?.label);
                    }
                }
            }
            if (
                hiddenLabels.size !== newHiddenLabels.size ||
                ![...hiddenLabels].every((value) => newHiddenLabels.has(value))
            ) {
                setHiddenLabels(newHiddenLabels);
            }
        }
    }, [parsedMeta, scoreBound, hiddenLabels]);

    return (
        <div className="editor-container">
            <div className="left-column">
                <div className="image-controls">
                    <div className="checkbox">
                        <input
                            type="checkbox"
                            className="image-smoothing-checkbox"
                            id="image-smoothing"
                            onChange={updateSmoothing}
                        />
                        <label
                            htmlFor="image-smoothing"
                            className="checkbox-label"
                        >
                            Pixelated
                        </label>
                    </div>
                    <div className="checkbox">
                        <input
                            type="checkbox"
                            className="grayscale-checkbox"
                            id="grayscale"
                            onChange={updateGrayscale}
                        />
                        <label htmlFor="grayscale" className="checkbox-label">
                            Grayscale
                        </label>
                    </div>
                    {!isMulti && (
                        <div className="slider-container">
                            <div className="zoom-label">Zoom:</div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                defaultValue={`${canvasScale}`}
                                className="zoom-slider"
                                id="zoom-slide"
                                onChange={updateCanvasScale}
                                step="0.01"
                            />
                        </div>
                    )}
                </div>
                {displayMeta && (
                    <div className="metadata-control">
                        <Accordion label="Metadata">
                            <pre>
                                <code>
                                    {JSON.stringify(displayMeta, null, 4)}
                                </code>
                            </pre>
                        </Accordion>
                    </div>
                )}
                {
                    <div className="score-control">
                        <div className="slider-container">
                            <div className="zoom-label">Score:</div>
                            <input
                                type="range"
                                ref={scoreRef}
                                min="0"
                                max="1"
                                defaultValue="0"
                                className="zoom-slider"
                                id="zoom-slide"
                                step="0.001"
                                onChange={updateScoreBound}
                            />
                        </div>
                    </div>
                }
                <div className="labels-container">
                    {!!formattedLabels &&
                        formattedLabels.map((label) => (
                            <Label
                                label={label}
                                hidden={hiddenLabels.has(label)}
                                addLabel={addLabel}
                                removeLabel={removeLabel}
                            />
                        ))}
                </div>
            </div>
            <div className={`right-column ${isMulti && 'multi-canvas'}`}>
				<CanvasContainer
					urls={urls}
					url={url}
					dgid={dgid}
					assetId={assetId}
					isMulti={isMulti}
					drawImage={drawImage}
					filterLabels={filterLabels}
					scoreBound={scoreBound}
					strValue={strValue}
				/>
            </div>
        </div>
    );
};

export default ImageCanvas;

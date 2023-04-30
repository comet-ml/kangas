'use client';

import styles from './ImageCanvas.module.scss';
import "./Mui.css";
import classNames from 'classnames/bind';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { CanvasContext } from '@kangas/app/contexts/CanvasContext';
import Label from './Label';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { ExpandMoreOutlined } from '@material-ui/icons';
import { JsonViewer } from '@textea/json-viewer';
import { isTagHidden } from '@kangas/lib/tags';

const cx = classNames.bind(styles);

const ImageCanvasControls = ({ initLabels=[] }) => {
    const {
        updateScore,
        labels=initLabels,
        showLabel,
        hiddenLabels,
        hideLabel,
        metadata,
        isGroup,
        updateSettings,
        settings,
        images
    } = useContext(CanvasContext);

    const onChange = useCallback((e) => updateScore(Number(e.target.value)), []);

    const toggleLabel = useCallback((tag) => {
        if (isTagHidden(hiddenLabels, tag)) {
            showLabel(tag);
        } else {
            hideLabel(tag);
        }
    }, [hiddenLabels, showLabel, hideLabel]);

    const updateCanvasScale = useCallback((value) => {
        updateSettings({ zoom: value.target.value });
    }, [updateSettings]);


    const updateCanvasSmooth = useCallback((value) => {
        updateSettings({ smooth: !value.target.checked });
    }, [updateSettings]);


    const updateCanvasGray = useCallback((value) => {
        updateSettings({ gray: value.target.checked });
    }, [updateSettings]);


    const scoreRange = useMemo(() => {
        let min = 0;
        let max = 1;

        for (const group in metadata) {
            const groupMin = group?.scoreMin ?? 0;
            const groupMax = group?.scoreMax ?? 0;

            if (groupMin < min) {
                min = groupMin;
            }

            if (groupMax > max) {
                max = groupMax
            }
        }

        return {
            min,
            max
        };
    }, [metadata]);

    const displayMeta = useMemo(() => {
        // Metadata comes from different places depending on if image is grouped
        if (isGroup) return null;
        if (metadata) return metadata;
        if (Object.keys(images)?.length === 1) return images?.[0]
        else return null;
    }, [metadata, images]);

    return (
        <div className={cx('editor-controls')}>
            <div className={cx('image-controls')}>
                <div className={cx('checkbox')}>
                    <input
                        type="checkbox"
                        className={cx("image-smoothing-checkbox")}
                        id="image-smoothing"
                        onChange={updateCanvasSmooth}
                    />
                    <label
                        htmlFor="image-smoothing"
                        className={cx("checkbox-label")}
                    >
                        Pixelated
                    </label>
	        </div>
                <div className={cx("checkbox")}>
                        <input
                            type="checkbox"
                            className={cx("grayscale-checkbox")}
                            id="grayscale"
                            onChange={updateCanvasGray}
                        />
                       <label htmlFor="grayscale" className={cx("checkbox-label")}>
                            Grayscale
                        </label>
                </div>
	    </div>
            { !isGroup && (
                <div className={cx('zoom-control')}>
                    <div className={cx('slider-container')}>
                    <div>Zoom:</div>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            defaultValue={`${settings?.zoom ?? 1.0}`}
                            className={cx("zoom-slider")}
                            id="zoom-slide"
                            step="0.001"
                            onChange={updateCanvasScale}
                        />

                    </div>
                </div>
            ) }
            <div className={cx('score-control')}>
                <div className={cx('slider-container')}>
                    <div>Score:</div>
                    <input
                        type="range"
                        min={`${scoreRange.min}`}
                        max={`${scoreRange.max}`}
                        defaultValue={`${scoreRange.min}`}
                        className={cx("zoom-slider")}
                        id="zoom-slide"
                        step="0.001"
                        onChange={onChange}
                    />
                </div>
            </div>
            {
                !isGroup && (
                    <Accordion elevation={0}>
                        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                            Metadata
                        </AccordionSummary>
                        <AccordionDetails>
                          <div className={cx("metadata-div")}>
                            <JsonViewer value={displayMeta}
                                rootName={false}
                                theme="light"
                                indentWidth={4}
                                defaultInspectDepth={1}
                                collapseStringsAfterLength={15}
                                enableClipboard={true}
                                displayObjectSize={true}
                                displayDataTypes={false}
                                objectSortKeys={true}
                            />
                          </div>
                        </AccordionDetails>
                    </Accordion>
                )
            }
            <div className={cx('labels-container')}>
                { labels?.sort().map(l => <Label toggle={toggleLabel} label={l} />) }
            </div>
        </div>
    )
};

export default ImageCanvasControls;

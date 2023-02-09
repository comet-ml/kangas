'use client';

import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import Label from './Label';

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
    } = useContext(CanvasContext);

    const onChange = useCallback((e) => updateScore(Number(e.target.value)), []);

    const toggleLabel = useCallback((label) => {
        if (!!hiddenLabels?.[label]) {
            showLabel(label);
        } else {
            hideLabel(label)
        }
    }, [hiddenLabels, showLabel, hideLabel]);

    const updateCanvasScale = useCallback((value) => {
        updateSettings({ zoom: value.target.value });
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
        }
    }, [metadata])

    return (
        <div className={cx('editor-controls')}>
            { !isGroup && (
                <div className={cx('zoom-control')}>
                    <div className={cx('slider-container')}>
                    <div>Zoom:</div>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            defaultValue={`${settings?.zoom ?? 1.0}`}
                            className="zoom-slider"
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
                        className="zoom-slider"
                        id="zoom-slide"
                        step="0.001"
                        onChange={onChange}
                    />
                </div>
            </div>
            <div className={cx('labels-container')}>
                { labels?.sort().map(l => <Label toggle={toggleLabel} label={l} />) }
            </div>
        </div>
    )
}

export default ImageCanvasControls;

'use client';

import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import Label from './Label';

const cx = classNames.bind(styles);

const ImageCanvasControls = ({  }) => {
    const { updateScore, labels=[], showLabel, hiddenLabels, hideLabel, metadata } = useContext(CanvasContext);
    const onChange = useCallback((e) => updateScore(Number(e.target.value)), []);
    const toggleLabel = useCallback((label) => {
        if (!!hiddenLabels?.[label]) {
            showLabel(label);
        } else {
            hideLabel(label)
        }
    }, [hiddenLabels, showLabel, hideLabel]);

    const scoreRange = useMemo(() => {
        let min = 0;
        let max = 0;

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
            <div className="score-control">
                <div className="slider-container">
                    <div className="zoom-label">Score:</div>
                    <input
                        type="range"
                        //min={`${scoreRange.min}`}
                        //max={`${scoreRange.max}`}
                        //defaultValue={`${scoreRange.min}`}
                        min={0}
                        max={1}
                        defaultValue={0}
                        className="zoom-slider"
                        id="zoom-slide"
                        step="0.001"
                        onChange={onChange}
                    />
                </div>
            </div>
            <div className={cx('labels-container')}>
                { labels?.map(l => <Label toggle={toggleLabel} label={l} />) }
            </div>
        </div>    
    )
}

export default ImageCanvasControls;
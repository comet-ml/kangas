'use client';

import { useCallback, useMemo, useEffect, useRef, useState, useContext } from 'react';
import { CanvasContext } from '../../../contexts/CanvasContext';
import useLabels from '../../../../lib/hooks/useLabels';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const ImageCanvasOutput = ({ assetId, drawImage, drawLabels }) => {
    const imageCanvas = useRef();
    const labelCanvas = useRef();
    const { metadata } = useContext(CanvasContext);
    const { image, overlays, labels } = useLabels(assetId)

    console.log('here I am');
    console.log(assetId)
    
    useEffect(() => {
        if (!imageCanvas?.current) return;

    }, [drawImage]);

    useEffect(() => {
        if (!labelCanvas?.current) return;

    }, [drawLabels]);

    return (
        <div className={cx('canvas-container')}>
            <canvas ref={imageCanvas} height={472} width={492} />
            <canvas ref={labelCanvas} height={472} width={492} />
        </div>
    )

}

export default ImageCanvasOutput;

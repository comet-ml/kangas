'use client';

import { useEffect, useMemo, useState, useContext } from "react";
import fetchAssetMetadata from "@kangas/lib/fetchAssetMetadata";
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import Deferred from "@kangas/app/DeferredComponent";
import CanvasProvider from "@kangas/app/contexts/CanvasContext";
import { ConfigContext } from "@kangas/app/contexts/ConfigContext";
import ImageCanvasControls from "./Controls";
import ImageCanvasOutputClient from "./OutputClient";

const cx = classNames.bind(styles);

const ExpandedCanvasClientSide = ({ dgid, timestamp, assetId }) => {
    const { config } = useContext(ConfigContext);
    const [metadata, setMetadata] = useState({});

    useEffect(() => {
        fetchAssetMetadata({ dgid, timestamp, assetId, ssr: false })
            .then(res => {
                setMetadata(res);
            })
    }, [dgid, timestamp, assetId]);

    const querystring = useMemo(() => {
        const url = new URLSearchParams({
            assetId,
            dgid,
            timestamp,
            endpoint: 'download'
        }).toString();
        return url;
    }, [assetId, dgid, timestamp]);

    const labels = useMemo(() => {
        const labels = new Set();
        if (typeof(metadata.annotations) !== 'undefined') {
            for (const annotation of metadata.annotations) {
                for (const data of annotation.data) {
                    if (data.label) {
                        labels.add(data.label);
                    }
		            if (data.labels) {
                        for (const label of data.labels) {
                            labels.add(label);
                        }
                    }
                }
            }
        }
        return Array.from(labels);
    }, [metadata])

    return (
      <CanvasProvider value={{ images: { [assetId]: { fetchedMeta: false }}, metadata, isGroup: false }}>
        <div className={cx('image-editor')}>
            <ImageCanvasControls initLabels={labels} />
            <div className={cx('canvas-column')}>
                <div className={cx('output-container')}>
                    <Deferred>
                        <ImageCanvasOutputClient
                            assetId={assetId}
                            timestamp={timestamp}
                            dgid={dgid}
                            imageSrc={`${config.rootPath}api/image?${querystring}`}
                        />
                    </Deferred>
                </div>
            </div>
        </div>
      </CanvasProvider>
    );
};

export default ExpandedCanvasClientSide;

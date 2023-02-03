import { Suspense } from "react";
import config from "../../../../config";
import fetchAsset from "../../../../lib/fetchAsset";
import fetchAssetMetadata from "../../../../lib/fetchAssetMetadata";
import CanvasProvider from "../../../contexts/CanvasContext";
import ImageCanvasClient from "./ImageCanvasClient";
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import ImageCanvasControls from "./Controls";
import ImageCanvasOutput from "./Output";
const cx = classNames.bind(styles);

// TODO Nuke this from orbit
const HackyWrapper = async ({ assetId, dgid }) => {
    const labels = await fetchAssetMetadata({ assetId, dgid });
    return <ImageCanvasControls inheritedLabels={Object.keys(JSON.parse(labels)?.labels)} />
}
const ImageCanvasCell = async ({ assets, query }) => {
    const { dgid, timestamp } = query;

    return (
        <Suspense fallback={<>Loading</>}>
            <div className={cx('image-editor')}>
                { assets?.length > 1 ? <ImageCanvasControls /> : <HackyWrapper assetId={assets[0]} dgid={dgid} />}
                <div className={cx('canvas-column')}>
                    { assets?.map(id => <ImageCanvasOutput dgid={dgid} timestamp={timestamp} assetId={id} /> )}
                </div>
            </div>
        </Suspense>
    )
}

export default ImageCanvasCell;

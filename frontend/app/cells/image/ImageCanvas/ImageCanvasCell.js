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

const ImageCanvasCell = async ({ assets, query }) => {
    const { dgid, timestamp } = query;
    /*const image = await fetchAsset({
        query: { assetId, dgid, timestamp },
        returnUrl: true,
        json: true
    });*/

    // const labels = await fetchAssetMetadata({ assetId, dgid, timestamp });

    return (
        <Suspense fallback={<>Loading</>}>
            <div className={cx('image-editor')}>
                <ImageCanvasControls />
                <div className={cx('canvas-column')}>
                    { assets?.map(id => <ImageCanvasOutput assetId={id} /> )}
                </div>
            </div>
        </Suspense>
    )
}

export default ImageCanvasCell;

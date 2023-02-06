import { Suspense } from "react";
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import ImageCanvasControls from "./Controls";
import ImageCanvasOutput from "./Output";
import Deferred from "../../../DeferredComponent";
const cx = classNames.bind(styles);

const ImageCanvasCell = async ({ assets, query }) => {
    const { dgid, timestamp } = query;
    return (
        <Suspense fallback={<>Loading</>}>
            <div className={cx('image-editor')}>
                <ImageCanvasControls />
                <div className={cx('canvas-column')}>
                    { assets?.map(id => (
                    <Deferred>
                        <ImageCanvasOutput dgid={dgid} timestamp={timestamp} assetId={id} /> 
                    </Deferred>
                    ) ) }
                </div>
            </div>
        </Suspense>
    )
}

export default ImageCanvasCell;

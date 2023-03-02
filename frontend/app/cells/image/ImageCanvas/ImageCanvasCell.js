import { Suspense } from "react";
import DialogueModal from '../../../modals/DialogueModal/DialogueModalClient';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import ImageCanvasControls from "./Controls";
import ImageCanvasOutput from "./Output";
//import ImageCanvasClient from "./ImageCanvasClient";
import Deferred from "../../../DeferredComponent";
import CanvasProvider from "../../../contexts/CanvasContext";
import fetchAssetMetadata from '../../../../lib/fetchAssetMetadata';
import fetchAsset from '../../../../lib/fetchAsset';

const cx = classNames.bind(styles);

// CK review:
// 1. added ImageCanvasCellStandAlone
// 2. added initLabels

const ImageCanvasCellStandAlone = async ({dgid, timestamp, assetId}) => {
    const query = {
        dgid,
        timestamp,
        assetId,
    };
    const metadata = await fetchAssetMetadata(query);

    const getLabels = (metadata) => {
        const labels = new Set();
        if (typeof(metadata.annotations) !== 'undefined') {
            for (const annotation of metadata.annotations) {
                for (const data of annotation.data) {
                    labels.add(data.label);
                }
            }
        }
        return Array.from(labels);
    };

    const labels = getLabels(metadata);

    const imageStore = {};
    imageStore[assetId] = {
        fetchedMeta: false
    };

    return (
      <CanvasProvider value={{ images: imageStore, metadata, isGroup: false }}>
        <div className={cx('image-editor')}>
            <ImageCanvasControls initLabels={labels} />
            <div className={cx('canvas-column')}>
                <ImageCanvasOutput dgid={dgid} timestamp={timestamp} assetId={assetId} />
            </div>
        </div>
      </CanvasProvider>
    );
};

const ImageCanvasCell = async ({ assets, query }) => {
    const { dgid, timestamp } = query;

    const isGroup = typeof(query.groupBy) !== 'undefined';

    return (
        <Suspense fallback={<>Loading</>}>
            <div className={cx('image-editor')}>
                <ImageCanvasControls />
                <div className={cx('canvas-column')}>
                    { isGroup ? assets?.map(id => (
                        <Deferred fallbackProps={{ style: { height: '400px' }}}>
                            <DialogueModal fullScreen={false} toggleElement={
                                <ImageCanvasOutput dgid={dgid} timestamp={timestamp} assetId={id} />
                            } >

                                <Suspense fallback={<>Loading</>}>
                                    <ImageCanvasCellStandAlone dgid={dgid} timestamp={timestamp} assetId={id} />
                                </Suspense>

                            </DialogueModal>
                        </Deferred>
                    ) ) : (
                      <Deferred>
                          <ImageCanvasOutput dgid={dgid} timestamp={timestamp} assetId={assets[0]} />
                      </Deferred>
                    )}
                </div>
            </div>
        </Suspense>
    );
}

export default ImageCanvasCell;

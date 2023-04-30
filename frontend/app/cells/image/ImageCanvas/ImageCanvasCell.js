import { Suspense } from "react";
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalClient';
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import ImageCanvasControls from "./Controls";
import ImageCanvasOutput from "./Output";
//import ImageCanvasClient from "./ImageCanvasClient";
import Deferred from "@kangas/app/DeferredComponent";
import CanvasProvider from "@kangas/app/contexts/CanvasContext";
import fetchAssetMetadata from '@kangas/lib/fetchAssetMetadata';
import fetchAsset from '@kangas/lib/fetchAsset';
import ExpandedCanvasClientSide from "./ExpandedCanvasClientSide";

const cx = classNames.bind(styles);


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
                                    <ExpandedCanvasClientSide dgid={dgid} timestamp={timestamp} assetId={id} />
                                </Suspense>

                            </DialogueModal>
                        </Deferred>
                    ) ) : (
                      <Deferred>
                          <ImageCanvasOutput dgid={dgid} timestamp={timestamp} assetId={assets?.[0]} />
                      </Deferred>
                    )}
                </div>
            </div>
        </Suspense>
    );
}

export default ImageCanvasCell;

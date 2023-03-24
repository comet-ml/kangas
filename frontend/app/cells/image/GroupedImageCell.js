import fetchAsset from '../../../lib/fetchAsset';
import ImageCanvasCell from './ImageCanvas/ImageCanvasCell';
import CanvasProvider from "../../contexts/CanvasContext";

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
import { Suspense } from 'react';
import fetchAssetGroupMetadata from '../../../lib/fetchAssetGroupMetadata';
const cx = classNames.bind(styles);

const ThumbnailGroupCell = async ({ value, query, columnName, expanded }) => {
    // TODO Un-hardcode these properties
    const image = await fetchAsset({
        query: {
            gallerySize: [3, 2],
            backgroundColor: [255, 255, 255],
            imageSize: [100, 55],
            borderWidth: 2,
            ...value
        },
        returnUrl: true,
        thumbnail: true
    });

    return (
            <div className={cx(["cell", "group"])}>
                <img
                    src={`data:application/octet-stream;base64,${image}`}
                    alt="DataGrid Image"
                />
            </div>
    );
};

const ExpandedGroupedCell = async ({ value }) => {
    const images = await fetchAsset({ query: value });
    const metadata = await fetchAssetGroupMetadata({ query: value });

    const imageStore = {};
    for (const image of images?.values) {
        imageStore[image] = {
            fetchedMeta: false
        }
    }


    return (
        <CanvasProvider value={{ images: imageStore, metadata, isGroup: true }}>
            <Suspense fallback={<>Loading</>}>
                <ImageCanvasCell assets={images?.values} query={value} />
            </Suspense>
        </CanvasProvider>
    )
}

const GroupedImageCell = ({ value, query, columnName, expanded }) => {
    if (!expanded) return <ThumbnailGroupCell value={value} query={query} columnName={columnName} expanded={expanded} />

    else {
        return (
            <Suspense fallback={<>Loading Images...</>}>
                <ExpandedGroupedCell value={value} />
            </Suspense>
        )
    }
}

export default GroupedImageCell;

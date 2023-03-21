import fetchAsset, { parseEndpoint } from '../../../lib/fetchAsset';
import ImageCanvasCell from './ImageCanvas/ImageCanvasCell';
import { Suspense } from 'react';
import config from '../../../config';
// TODO create a parseDataURL helper

import Image from 'next/image';
import fetchAssetMetadata from '../../../lib/fetchAssetMetadata';
import CanvasProvider from '../../contexts/CanvasContext';

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

const PlainImageCell = async ({ value, query, expanded=false, style }) => {
    const endpoint = parseEndpoint({ thumbnail: true, group: !!query?.groupBy });
    const queryString = new URLSearchParams({
        assetId: value?.assetId,
        dgid: query?.dgid,
        timestamp: query?.timestamp,
        thumbnail: true,
        endpoint
    }).toString();

    const ImageOrNone = value?.assetId ? (<img src={`/api/image?${queryString}`} alt="DataGrid Image" />) : (<>None</>);

    return (
            <div className={cx("cell-content")} style={style}>
            {ImageOrNone}
            </div>
    );
};

const ExpandedWrapper = async ({ value, query }) => {
    const metadata = await fetchAssetMetadata({ assetId: value?.assetId, dgid: query?.dgid, timestamp: query?.timestamp });
    let labels = [];

    if (metadata) {
        try {
            labels = Object.keys(metadata?.labels);
        } catch {
            console.log("Can't decode labels");
        }
    }

    return (
        <CanvasProvider
            value={{
                labels,
                metadata
            }}
        >
            <ImageCanvasCell assets={[value?.assetId]} query={query} />
        </CanvasProvider>
    );
}

const ImageCell = ({ value, query, expanded, style }) => {
    const Component = (expanded && value?.assetId) ? ExpandedWrapper : PlainImageCell;

    return (
        <Suspense fallback={<>Loading</>}>
            <Component value={value} query={query} expanded={expanded} style={style} />
        </Suspense>
    );
}

export default ImageCell;

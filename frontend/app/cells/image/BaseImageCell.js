import fetchAsset, { parseEndpoint } from '../../../lib/fetchAsset';
import ImageCanvasCell from './ImageCanvas/ImageCanvasCell';
import { Suspense } from 'react';
import config from '../../../config';
// TODO create a parseDataURL helper

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
import Image from 'next/image';

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

    return (
            <div className={cx("cell-content")} style={style}>
                <img
                    src={`/api/image?${queryString}`}
                    alt="DataGrid Image"
                />
            </div>
    );
};

const ImageCell = ({ value, query, expanded, style }) => {
    const Component = expanded ? ImageCanvasCell : PlainImageCell;
    return (
        <Suspense fallback={<>Loading</>}>
            <Component value={value} query={query} expanded={expanded} style={style} />
        </Suspense>
    )
}

export default ImageCell;

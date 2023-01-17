import fetchAsset, { parseEndpoint } from '../../../lib/fetchAsset';
import ImageCanvasCell from './ImageCanvas/ImageCanvasCell';
import { Suspense } from 'react';
import config from '../../../config';
// TODO create a parseDataURL helper

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
import Image from 'next/image';

const cx = classNames.bind(styles);


const PlainImageCell = ({ value, query, expanded=false, style }) => {
    const endpoint = parseEndpoint({ thumbnail: true, group: !!query?.groupBy });
    const queryString = new URLSearchParams({ assetId: value?.assetId, dgid: query?.dgid, thumbnail: true }).toString();
    //const res = await fetch(`${config.apiUrl}${endpoint}?${queryString}`, { next: { revalidate: 1000 } });
    //const image = await res.blob();
    //const imageUrl = URL.createObjectURL(image);

    return (
            <div className={cx("cell-content")} style={style}>
                <img
                    src={`${config.apiUrl}${endpoint}?${queryString}`}
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

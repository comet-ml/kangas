import fetchAsset from '../../../lib/fetchAsset';
import ImageCanvasCell from './ImageCanvas/ImageCanvasCell';
import { Suspense } from 'react';
// TODO create a parseDataURL helper

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';

const cx = classNames.bind(styles);


const PlainImageCell = async ({ value, query, expanded=false, style }) => {
    const { type, assetType, assetId } = value;
    const { dgid } = query;
    const image = await fetchAsset({ query: { assetId, dgid, thumbnail: true }, returnUrl: true });

    return (
            <div className={cx("cell-content")} style={style}>
                <img
                    src={`data:application/octet-stream;base64,${image}`}
                    alt="DataGrid Image"
                />
            </div>
    );
};

const ImageCell = ({ value, query, expanded, style }) => {
    return (
        <Suspense fallback={<>Loading</>}>
            {!!expanded && <ImageCanvasCell value={value} query={query} expanded={true} /> }
        { !expanded && <PlainImageCell value={value} query={query} expanded={false} style={style} /> }
        </Suspense>
    )
}

export default ImageCell;

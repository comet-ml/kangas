import fetchAsset from '../../../lib/fetchAsset';
import ImageCanvasCell from './ImageCanvasCell';
import { Suspense } from 'react';
// TODO create a parseDataURL helper

const PlainImageCell = async ({ value, query, expanded }) => {
    const { type, assetType, assetId } = value;
    const { dgid } = query;
    const image = await fetchAsset({ query: { assetId, dgid }, returnUrl: true, thumbnail: !expanded });

    return (
            <div className="cell-content">
                <img
                    src={`data:application/octet-stream;base64,${image}`}
                    alt="DataGrid Image"
                />
            </div>
    );
};

const ImageCell = ({ value, query, expanded }) => {
    if (expanded) return <Suspense fallback={<>Loading</>}><ImageCanvasCell value={value} query={query} expanded={expanded} /></Suspense>
    else return <PlainImageCell value={value} query={query} expanded={expanded} />
}

export default ImageCell;

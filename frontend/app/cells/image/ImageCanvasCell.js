import config from "../../../config";
import fetchAsset from "../../../lib/fetchAsset";
import ImageCanvasClient from "./ImageCanvasClient";
import { createCanvas, loadImage } from '../../../node_modules/canvas';

const ImageCanvasCell = async ({ value, query, columnName, expanded }) => {
    const { type, assetType, assetId } = value;
    const { dgid } = query;
    const image = await fetchAsset({ query: { assetId, dgid }, returnUrl: true, thumbnail: !expanded });

    // TODO: Abstract this into a fetchAssetMetadata method
    const data = await fetch(`${config.apiUrl}asset-metadata`, {
        method: 'post',
        body: JSON.stringify({
            assetId,
            dgid
        })
    })
    const metadata = await data.json()

    return <ImageCanvasClient value={value} query={query} expanded={expanded} metadata={metadata} image={image} />
}

export default ImageCanvasCell;
import { Suspense } from "react";
import config from "../../../../config";
import fetchAsset from "../../../../lib/fetchAsset";
import CanvasProvider from "../../../contexts/CanvasContext";
import ImageCanvasClient from "./ImageCanvasClient";

const ImageCanvasCell = async ({ value, query }) => {
    const { type, assetType, assetId } = value;
    const { dgid } = query;
    const image = await fetchAsset({ query: { assetId, dgid }, returnUrl: true });

    // TODO: Abstract this into a fetchAssetMetadata method
    const data = await fetch(`${config.apiUrl}asset-metadata`, {
        method: 'post',
        body: JSON.stringify({
            assetId,
            dgid
        })
    })
    const metadata = await data.json()

    return (
        <Suspense fallback={<>Loading</>}>
            <CanvasProvider value={JSON.parse(metadata)}>
                <ImageCanvasClient 
                    value={value}
                    query={query}
                    metadata={JSON.parse(metadata)}
                    image={image}
                />
            </CanvasProvider>
        </Suspense>
    )
}

export default ImageCanvasCell;
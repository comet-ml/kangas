import ImageCanvasOutputClient from "./OutputClient"
import fetchAsset from "../../../../lib/fetchAsset"
import fetchAssetMetadata from "../../../../lib/fetchAssetMetadata";


const ImageCanvasOutput = async ({ assetId, dgid, timestamp }) => {
    const querystring = new URLSearchParams({ 
        assetId, 
        dgid, 
        timestamp, 
        endpoint: 'download'
    }).toString();

    // TODO Fetch metadata here when we fix fetch retries/the open file limit on the server
    //const metadata = await fetchAssetMetadata({ assetId, dgid, timestamp });

    return (
        <div>
            <ImageCanvasOutputClient 
                assetId={assetId} 
                timestamp={timestamp}
                dgid={dgid}
                imageSrc={`/api/image?${querystring}`}
            />
        </div>
    )

}

export default ImageCanvasOutput;
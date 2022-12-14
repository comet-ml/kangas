import config from "../../../config";
import ImageCanvasClient from "./ImageCanvasClient";

const ImageCanvasCell = async ({ value, query, columnName, expanded }) => {
    const data = await fetch(`${config.apiUrl}asset-metadata`, {
        method: 'post',
        body: JSON.stringify({
            assetId: value?.assetId,
            dgid: query?.dgid
        })
    })
    const metadata = await data.json()
    return <ImageCanvasClient value={value} query={query} columnName={columnName} expanded={expanded} metadata={metadata} />
}

export default ImageCanvasCell;
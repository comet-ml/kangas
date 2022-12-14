import ImageCanvasClient from "./ImageCanvasClient";

const ImageCanvasCell = ({ value, query, columnName, expanded }) => {
    return <ImageCanvasClient value={value} query={query} columnName={columnName} expanded={expanded} />
}

export default ImageCanvasCell;
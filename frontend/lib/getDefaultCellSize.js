import cellMap from "./consts/cellMap";

const getDefaultCellSize = (cellType, grouped) => {
    if (grouped) {
        if (typeof(cellMap[cellType]) !== 'undefined') {
            return cellMap[cellType].groupedWidth;
        }
    }
    // Not grouped:
    if (typeof(cellMap[cellType]) !== 'undefined') {
        return cellMap[cellType].width;
    }
    console.log(`ERROR: missing cell type: ${cellType}`);
    return 200;
};

export default getDefaultCellSize;


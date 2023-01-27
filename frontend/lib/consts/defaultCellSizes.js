const defaultCellSizes = {
    TEXT: {
        width: 200,
        groupedWidth: 200,
        component: TextCell,
    },
    FLOAT: {
        width: 150,
        groupedWidth: 200,
        component: FloatCell
    },
    INTEGER: {
        width: 100,
        groupedWidth: 200,
        component: TextCell,
    },
    JSON: {
        width: 400,
        groupedWidth: 200,
        component: JSONCell

    },
    'IMAGE-ASSET': {
        width: 150,
        groupedWidth: 300,
        component: ImageCell
    },
    ROW_ID: {
        width: 50,
        groupedWidth: 50,
        component: TextCell
    }
};

const getDefaultCellSize = (cellType, grouped) => {
    if (grouped) {
        if (typeof(defaultCellSizes[cellType]) !== 'undefined') {
            return defaultCellSizes[cellType].groupedWidth;
        }
    }
    // Not grouped:
    if (typeof(defaultCellSizes[cellType]) !== 'undefined') {
        return defaultCellSizes[cellType].width;
    }
    console.log(`ERROR: missing cell type: ${cellType}`);
    return 200;
};

export default getDefaultCellSize;

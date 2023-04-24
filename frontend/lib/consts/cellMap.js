import TextCell from "../../app/cells/text";
import FloatCell from "../../app/cells/float";
import JSONCell from "../../app/cells/json";
import ImageCell from "../../app/cells/image";
import DateCell from "../../app/cells/date";
import EmbeddingCell from "../../app/cells/embedding";
import BooleanCell from "../../app/cells/boolean";
import LoadingCell from "../../app/cells/loading";
import NACell from "../../app/cells/na";

const cellMap = {
    TEXT: {
        width: 200,
        groupedWidth: 220,
        component: TextCell,
    },
    DATETIME: {
        width: 200,
        groupedWidth: 220,
        component: DateCell,
    },
    BOOLEAN: {
        width: 200,
        groupedWidth: 220,
        component: BooleanCell,
    },
    FLOAT: {
        width: 100,
        groupedWidth: 220,
        component: FloatCell
    },
    INTEGER: {
        width: 90,
        groupedWidth: 220,
        component: TextCell,
    },
    JSON: {
        width: 400,
        groupedWidth: 220,
        component: JSONCell

    },
    VECTOR: {
        width: 400,
        groupedWidth: 220,
        component: JSONCell

    },
    'TENSOR-ASSET': {
        width: 100,
        groupedWidth: 100,
        component: NACell

    },
    'IMAGE-ASSET': {
        width: 150,
        groupedWidth: 300,
        component: ImageCell
    },
    'EMBEDDING-ASSET': {
        width: 150,
        groupedWidth: 300,
        component: EmbeddingCell
    },
    ROW_ID: {
        width: 50,
        groupedWidth: 220,
        component: TextCell
    },
    LOADING: {
        width: 200,
        groupedWidth: 220,
        component: LoadingCell
    }
};

export default cellMap;

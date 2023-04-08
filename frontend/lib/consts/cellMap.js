import TextCell from "../../app/cells/text";
import FloatCell from "../../app/cells/float";
import JSONCell from "../../app/cells/json";
import ImageCell from "../../app/cells/image";
import DateCell from "../../app/cells/date";
import BooleanCell from "../../app/cells/boolean";
import LoadingCell from "../../app/cells/loading";

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
    'IMAGE-ASSET': {
        width: 150,
        groupedWidth: 300,
        component: ImageCell
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

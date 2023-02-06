import TextCell from "../../app/cells/text";
import FloatCell from "../../app/cells/float";
import JSONCell from "../../app/cells/json/JSONCell";
import ImageCell from "../../app/cells/image";
import DateCell from "../../app/cells/date";

const cellMap = {
    TEXT: {
        width: 200,
        groupedWidth: 200,
        component: TextCell,
    },
    DATETIME: {
        width: 200,
        groupedWidth: 200,
        component: DateCell,
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
        groupedWidth: 100,
        component: TextCell
    }
};

export default cellMap;

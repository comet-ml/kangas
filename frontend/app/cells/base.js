// This is the base cell class. Mostly, this is used for wrapping everything in <Suspense />

import FloatCell from './float/FloatCell';
import ImageCell from './image/ImageCell';
import JSONCell from './json/JSONCell';
import TextCell from './text/TextCell';

const cellMap = {
    TEXT: {
        component: TextCell,
    },
    FLOAT: {
        component: FloatCell
    },
    'IMAGE-ASSET': {
        component: ImageCell
    },
    JSON: {
        component: JSONCell
    }
}

const Cell = async ({ value, type, dgid }) => {
    const Component = cellMap?.[type]?.component;
    return (
        <>
            { !!Component && <Component value={value} dgid={dgid} />}
            { !Component && <div>{`${value} - ${type}`}</div> }
        </>
    )
}

export default Cell;
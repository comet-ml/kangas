import linkify from "linkify-string";

import formatValue from "../../../lib/formatValue";

const TextCell = ({ value, style, expanded=false }) => {

    const text = expanded ? linkify(formatValue(value, 'TEXT')) : formatValue(value, 'TEXT');

    return (
        <div className="cell-content" style={style}>
            <div dangerouslySetInnerHTML={{__html: text}} />
        </div>
    );

}

export default TextCell;

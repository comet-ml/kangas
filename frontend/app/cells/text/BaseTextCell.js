import formatValue from "../../../lib/formatValue"

const TextCell = ({ value, style }) => {
    return (
        <div className="cell-content" style={style}>
            {`${formatValue(value, 'TEXT')}`}
        </div>
    )

}

export default TextCell;

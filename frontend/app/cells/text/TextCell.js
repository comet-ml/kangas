import formatValue from "../../../lib/formatValue"

const TextCell = ({ cell }) => {
    return (
        <div className="cell-content">
            {`${formatValue(cell, 'TEXT')}`}
        </div>
    )

}

export default TextCell;
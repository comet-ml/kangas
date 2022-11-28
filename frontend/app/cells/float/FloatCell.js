import formatValue from "../../../lib/formatValue"

const FloatCell = ({ cell }) => {
    return (
        <div className="cell-content">
            {`${formatValue(cell, 'FLOAT')}`}
        </div>
    )

}

export default FloatCell;
import formatValue from "../../../lib/formatValue"

const BaseFloatCell = ({ value, style }) => {
    return (
        <div className="cell-content" style={style}>
            {`${formatValue(value, 'FLOAT')}`}
        </div>
    )

}

export default BaseFloatCell;

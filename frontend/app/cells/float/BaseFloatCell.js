import formatValue from "../../../lib/formatValue"

const BaseFloatCell = ({ value }) => {
    return (
        <div className="cell-content">
            {`${formatValue(value, 'FLOAT')}`}
        </div>
    )

}

export default BaseFloatCell;
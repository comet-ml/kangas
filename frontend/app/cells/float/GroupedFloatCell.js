import Histogram from "../charts/Histogram/Histogram";

const GroupedFloatCell = ({ value }) => {
    return (
        <div className="cell-content">
            <Histogram value={value} />
        </div>
    )
}

export default GroupedFloatCell;
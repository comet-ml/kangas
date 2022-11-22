const VectorCell = ({ value }) => {
    const stringValue = value ? value : "None";

    return <div className="cell-content json">{stringValue}</div>;
};

export default VectorCell;

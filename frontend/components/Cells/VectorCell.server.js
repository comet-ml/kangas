const VectorCell = ({ value }) => {
    const stringValue = value ? value : "[]";

    return <div className="cell-content json">{stringValue}</div>;
};

export default VectorCell;

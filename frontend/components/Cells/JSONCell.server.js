const JSONCell = ({ value }) => {
    const jsonValue = value ? JSON.stringify(value) : "None";

    return <div className="cell-content json">{jsonValue}</div>;
};

export default JSONCell;

const JSONCell = ({ value }) => {
    const jsonValue = value;

    const strValue = "(" + Object.keys(jsonValue)
        .filter((key) => ['string', 'number', 'boolean'].includes(typeof key))
        .map((key) => `"${key}": ${jsonValue[key]}`)
        .join(', ') + "}";
    return <div className="cell-content json">{strValue}</div>;
};

export default JSONCell;

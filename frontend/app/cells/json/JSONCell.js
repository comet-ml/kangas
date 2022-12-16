const JSONCell = ({ value, query, style }) => {
    return (
    <div className="cell-content" style={style}>
        <pre>
            {JSON.stringify(value)}
        </pre>
    </div>
    );
};

export default JSONCell;

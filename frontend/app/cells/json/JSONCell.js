const replacer = (key, value) => {
    if (key?.length === 0) {
        // On initial run, JSON.stringify()'s replacer passes the entire object 
        // as a key/value pair with an empty string for a key i.e. { "": Object }
        return value;
    }
    else if (['string', 'boolean', 'number'].includes(typeof value)) {
        return value;
    } else {
        return undefined;
    }
}
const JSONCell = ({ value, query }) => {
    return (
    <div className="cell-content">
        <pre>
            {JSON.stringify(value, replacer, 4)}
        </pre>
    </div>
    );
};

export default JSONCell;

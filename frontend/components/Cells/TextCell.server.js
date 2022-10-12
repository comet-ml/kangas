import formatValue from '../../lib/formatValue';

const TextCell = ({ value }) => {
    return (
        <div className="cell-content">{`${formatValue(value, 'TEXT')}`}</div>
    );
};

export default TextCell;

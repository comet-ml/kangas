import formatValue from '../../lib/formatValue';

const DateCell = ({ value }) => {
    return (
        <div className="cell-content">{`${formatValue(
            value,
            'DATETIME'
        )}`}</div>
    );
};

export default DateCell;

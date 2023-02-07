import formatValue from '../../../lib/formatValue';

const DateCell = ({ value, style }) => {
    return (
            <div className="cell-content" style={style}>{`${formatValue(
            value,
            'DATETIME'
        )}`}</div>
    );
};

export default DateCell;

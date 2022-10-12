// Utils
import formatValue from '../../lib/formatValue';

const FloatCell = ({ value }) => {
    return (
        <div className="cell-content">{`${formatValue(value, 'FLOAT')}`}</div>
    );
};

export default FloatCell;

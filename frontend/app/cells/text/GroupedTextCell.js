import Category from "../charts/category/Category";
import isPrimitive from '../../../lib/isPrimitive';
import formatValue from "../../../lib/formatValue";

const GroupedTextCell = ({ value }) => {
    const primitive = isPrimitive(value);

    return (
        <div className="cell group">
            { primitive && formatValue(value)}
            { !primitive && <Category value={value} />}
        </div>
    )
}

export default GroupedTextCell;
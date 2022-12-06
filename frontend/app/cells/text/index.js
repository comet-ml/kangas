import Base from './BaseTextCell';
import Grouped from './GroupedTextCell';

const TextCell = ({ value, isGrouped }) => {
    if (isGrouped) return <Grouped value={value} />
    else return <Base value={value} />
}

export default TextCell;
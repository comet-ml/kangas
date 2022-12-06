import Base from "./BaseFloatCell";
import Grouped from './GroupedFloatCell'

const FloatCell = ({ value, isGrouped }) => {
    if (!isGrouped) return <Base value={value} />;
    else  return <Grouped value={value} />;
};

export default FloatCell;
// Client components
import BooleanCellClient from './BooleanCell.client';

const BooleanCell = ({ value }) => {
    return (
        <div className="cell-content boolean">
            <BooleanCellClient value={value} />
        </div>
    );
};

export default BooleanCell;

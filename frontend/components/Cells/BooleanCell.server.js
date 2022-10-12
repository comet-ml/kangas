// Client components
import BooleanCellClient from './BooleanCell.client';

const BooleanCell = ({ value }) => {
    return (
        <div className="cell-content boolean">
            <BooleanCellClient sign={value === 1} />
        </div>
    );
};

export default BooleanCell;

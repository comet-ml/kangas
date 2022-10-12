import HistogramGroupClient from './HistogramGroupExpanded.client';

const HistogramGroupExpanded = ({ value, dgid }) => {
    return (
        <div className="cell-content histogram">
            <HistogramGroupClient value={value} />
        </div>
    );
};

export default HistogramGroupExpanded;

// Client components
import HistogramGroupClient from './HistogramGroupCell.client';

// Util
import DeferredCell from '../../DeferredCell.client';

// TODO Create a helper called generateLayout that also generates data.
const HistogramGroupCell = ({ value, dgid, defer }) => {
    return (
        <div className="cell-content histogram">
            { !defer && <HistogramGroupClient value={value} /> }
            { defer && (
                <DeferredCell>
                    <HistogramGroupClient value={value} />
                </DeferredCell>
                )
            }
        </div>
    );
};

export default HistogramGroupCell;

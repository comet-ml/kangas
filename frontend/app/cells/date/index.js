import Base from './BaseDateCell';
import Grouped from './GroupedDateCell';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const DateCell = ({ value, query, style }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query}  style={style} />}><Base value={value} query={query} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} />}><Grouped value={value} query={query} expanded={true} /></DialogueModal>
    );
}

export default DateCell;

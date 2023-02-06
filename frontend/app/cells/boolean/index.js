import Base from './BaseBooleanCell';
import Grouped from './GroupedBooleanCell';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const BooleanCell = ({ value, query, style }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query}  style={style} />}><Base value={value} query={query} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} />}><Grouped value={value} query={query} expanded={true} /></DialogueModal>
    );
}

export default BooleanCell;

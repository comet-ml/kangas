import Base from './BaseTextCell';
import Grouped from './GroupedTextCell';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const TextCell = ({ value, isGrouped }) => {
    if (!isGrouped) return (
        <DialogueModal toggleElement={<Base value={value} />}><Base value={value} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} />}><Grouped value={value} expanded={true} /></DialogueModal>
    );
}

export default TextCell;
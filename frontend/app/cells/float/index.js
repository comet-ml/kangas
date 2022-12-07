import DialogueModal from "../../modals/DialogueModal/DialogueModalClient";
import Base from "./BaseFloatCell";
import Grouped from './GroupedFloatCell'

const FloatCell = ({ value, isGrouped }) => {
    if (!isGrouped) return (
        <DialogueModal toggleElement={<Base value={value} />}><Base value={value} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} />}><Grouped value={value} /></DialogueModal>
    );
};

export default FloatCell;
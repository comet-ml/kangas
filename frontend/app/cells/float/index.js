import DialogueModal from "../../modals/DialogueModal/DialogueModalClient";
import Base from "./BaseFloatCell";
import Grouped from './GroupedFloatCell'

const FloatCell = ({ value, query, style }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query} style={style} />}><Base value={value} query={query} /></DialogueModal>
    );
    else return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} />}><Grouped value={value} query={query} expanded={true} /></DialogueModal>
    );
};

export default FloatCell;

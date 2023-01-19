import Base from './BaseTextCell';
import Grouped from './GroupedTextCell';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const TextCell = ({ value, query, style }) => {
    if (!query?.groupBy) return (
            <DialogueModal toggleElement={<Base value={value} query={query}  style={style} expanded={false}/>}><Base value={value} query={query} expanded={true}/></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} />}><Grouped value={value} query={query} expanded={false} /></DialogueModal>
    );
}

export default TextCell;

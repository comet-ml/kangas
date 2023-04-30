import Base from './BaseTextCell';
import Grouped from './GroupedTextCell';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalClient';

const TextCell = ({ value, query, style, ssr }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query}  style={style} />}><Base value={value} query={query} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} ssr={ssr} />}><Grouped value={value} query={query} expanded={true} ssr={ssr} /></DialogueModal>
    );
}

export default TextCell;

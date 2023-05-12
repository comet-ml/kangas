import Base from './BaseBooleanCell';
import Grouped from './GroupedBooleanCell';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalContainer';

const BooleanCell = ({ value, query, style, ssr }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query}  style={style} />}><Base value={value} query={query} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} ssr={ssr} />}><Grouped value={value} query={query} expanded={true} ssr={ssr} /></DialogueModal>
    );
}

export default BooleanCell;

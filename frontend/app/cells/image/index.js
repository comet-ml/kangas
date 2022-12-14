import Base from './BaseImageCell';
import Grouped from './GroupedImageCell';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const Image = ({ value, columnName, query }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query} />}>
            <Base value={value} query={query} expanded={true} />
        </DialogueModal>
    );
    else return (
        <DialogueModal toggleElement={<Grouped value={value} columnName={columnName} query={query} />}>
            <Grouped value={value} columnName={columnName} query={query} expanded={true} />
        </DialogueModal>
    );
}

export default Image;
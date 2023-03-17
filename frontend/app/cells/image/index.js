import Base from './BaseImageCell';
import Grouped from './GroupedImageCell';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const Image = ({ value, columnName, query, style }) => {
    if (!query?.groupBy || columnName?.toUpperCase() === query?.groupBy?.toUpperCase()) return (
        <DialogueModal toggleElement={<Base value={value} query={query} expanded={false} style={style} />}>
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

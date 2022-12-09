import Base from './BaseImageCell';
import Grouped from './GroupedImageCell';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const Image = ({ value, dgid, isGrouped }) => {
    if (!isGrouped) return (
        <DialogueModal toggleElement={<Base dgid={dgid} value={value} />}><Base dgid={dgid} value={value} expanded={true} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped dgid={dgid} value={value} />}><Grouped dgid={dgid} value={value} expanded={true} /></DialogueModal>
    );
}

export default Image;
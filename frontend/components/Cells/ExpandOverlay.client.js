/*
const DialogueModalContainer = dynamic(() => import('../Modals/DialogueModalContainer.client'), {
    ssr: false
});
*/

import DialogueModalContainer from '../Modals/DialogueModalContainer.client';

const ExpandOverlay = ({ children }) => {
    return (
        <div className="expand-overlay">
            <DialogueModalContainer>{children}</DialogueModalContainer>
        </div>
    );
};

export default ExpandOverlay;

import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';
import ComputedColumnsModal from '../../modals/ComputedColumnsModal';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const ComputedColumnsButton = ({ columns, query, completions }) => (
    <DialogueModal
        fullScreen={false}
        toggleElement={
            <div className={cx("button-outline")}>
                <span>+</span>
            </div>
        }
        sx={{
            "& .MuiDialog-container": {
                "& .MuiPaper-root": {
                    width: "100%",
                    maxWidth: "540px",  // Set your width here
                },
            },
           }}
        >
        <ComputedColumnsModal columns={columns} query={query} completions={completions}/>
    </DialogueModal>
);

export default ComputedColumnsButton;

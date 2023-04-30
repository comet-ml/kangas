import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalClient';
import ComputedColumnsModal from '@kangas/app/modals/ComputedColumnsModal';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const ComputedColumnsButton = ({columns, query, completions}) => (
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
                    maxWidth: "800px",  // Set your width here
                    maxHeight: "400px"
                },
            },
           }}
        >
        <ComputedColumnsModal columns={columns} query={query} completions={completions}/>
    </DialogueModal>
);

export default ComputedColumnsButton;

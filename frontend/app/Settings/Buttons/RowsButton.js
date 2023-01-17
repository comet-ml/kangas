'use client';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const cx = classNames.bind(styles);

const RowsButton = () => (
    <DialogueModal
        toggleElement={
            <div className={cx("button-outline")}>
                <img src="/columns_placeholder.png" /> <span>Rows</span>
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
            <div />
    </DialogueModal>
);

export default RowsButton;

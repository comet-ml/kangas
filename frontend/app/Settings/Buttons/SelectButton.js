'use client';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';
import MultiColumnSelectModal from '../../modals/MultiColumnSelectModal';

const cx = classNames.bind(styles);

const SelectButton = () => (
    <DialogueModal
        toggleElement={
            <div className={cx("button-outline")}>
                <img src="/columns_placeholder.png" /> <span>Columns</span>
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
            <MultiColumnSelectModal />
        </DialogueModal>
);

export default SelectButton;
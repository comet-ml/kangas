'use client';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalContainer';
import MultiColumnSelectModal from '@kangas/app/modals/MultiColumnSelectModal';

const cx = classNames.bind(styles);

const SelectButton = ({ columns }) => (
    <DialogueModal
        toggleElement={
            <div className={cx("button-outline")}>
                <img src="/kangas_images/columns_placeholder.png" /> <span>Columns</span>
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
            <MultiColumnSelectModal columns={columns} />
        </DialogueModal>
);

export default SelectButton;

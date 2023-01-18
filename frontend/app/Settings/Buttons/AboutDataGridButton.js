'use client';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import DialogueModal from '../../modals/DialogueModal/DialogueModalClient';

const cx = classNames.bind(styles);

const AboutDataGridButton = () => (
    <DialogueModal
        toggleElement={
                <div style={{color: "#5155f5"}}>
                <span>About this DataGrid</span>
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

export default AboutDataGridButton;

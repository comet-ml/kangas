'use client';

import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalClient';

const cx = classNames.bind(styles);

const AboutDataGridButton = ({text}) => {
    return (
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
            <div style={{display: "flex"}}>
                <div dangerouslySetInnerHTML={{__html: text}}
                    style={{width: '500px',
                            overflow: 'auto',
                            marginLeft: 'auto',
                            borderWidth: 'thin'}}></div>
            </div>
    </DialogueModal>
);
};

export default AboutDataGridButton;

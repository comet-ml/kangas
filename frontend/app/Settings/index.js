/* eslint-disable react/jsx-key */

import DialogueModal from '../modals/DialogueModal/DialogueModalClient';
import fetchStatus from '../../lib/fetchStatus';
// FIXME:
//import MatrixSelect from './MatrixSelectClient';
//import GroupBy from './GroupBy';
import RefreshButton from './RefreshButton';
//import FilterExpr from './FilterExpr';
import HelpText from './HelpText.js';
import { KangasButton, AboutDialog, SelectButton, HelpButton } from './Buttons';
import styles from './SettingsBar.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);


const SettingsBar = async ({query}) => {
    const status = await fetchStatus();
    const columns  = [];
    const matrices = [];
    const completions = {};

    return (
        <div className={cx('settings-bar')}>
            <div className={cx('left-settings-bar')}>
                <DialogueModal fullScreen={false} toggleElement={<KangasButton />}>
                    <AboutDialog status={status} />
                </DialogueModal>
                <div id="matrix-select" className={cx("select-row")}>
                    <RefreshButton query={query} />
                </div>
            </div>
            <div className={cx('right-settings-bar')}>
                <DialogueModal
                  toggleElement={<SelectButton />}
                  sx={{
                    "& .MuiDialog-container": {
                        "& .MuiPaper-root": {
                        width: "100%",
                        maxWidth: "540px",  // Set your width here
                        },
                    },
                  }}
                >
                </DialogueModal>
                <DialogueModal fullScreen={false} toggleElement={<HelpButton />}>
                  <HelpText />
                </DialogueModal>
            </div>
        </div>
    );
};

export default SettingsBar;

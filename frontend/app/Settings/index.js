/* eslint-disable react/jsx-key */

import DialogueModal from '../modals/DialogueModal/DialogueModalClient';
import fetchStatus from '../../lib/fetchStatus';
import fetchCompletions from '../../lib/fetchCompletions';
import MatrixSelect from './MatrixSelectClient';
import RefreshButton from './RefreshButton';
import FilterExpr from './FilterExpr';
import HelpText from './HelpText.js';
import { KangasButton, AboutDialog, SelectButton, HelpButton, GroupByButton, SortByButton } from './Buttons';
import styles from './SettingsBar.module.scss';
import classNames from 'classnames/bind';
import { Suspense } from 'react';
import fetchDatagrids from '../../lib/fetchDatagrids';

const cx = classNames.bind(styles);


const SettingsBar = async ({ query }) => {
    const status = await fetchStatus();
    const columns  = [];
    const options = await fetchDatagrids();
    const completions = await fetchCompletions(query?.dgid);

    return (
        <div className={cx('settings-bar')}>
            <div className={cx('left-settings-bar')}>
                <DialogueModal fullScreen={false} toggleElement={<KangasButton />}>
                    <Suspense fallback={<div>Loading</div>}>
                        <AboutDialog status={status} />
                    </Suspense>
                </DialogueModal>
                <MatrixSelect query={query} options={options} />
                <RefreshButton query={query} />
            </div>
            <div className={cx('right-settings-bar')}>
                <GroupByButton />
                <SortByButton />
                <SelectButton />
                <FilterExpr query={query} completions={completions} />
                <DialogueModal fullScreen={false} toggleElement={<HelpButton />}>
                  <HelpText />
                </DialogueModal>
            </div>
        </div>
    );
};

export default SettingsBar;

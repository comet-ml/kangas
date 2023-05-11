// Values are not displayable in the UI

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';

const cx = classNames.bind(styles);

const NACell = () => {

    return (
        <div className={cx(['cell', 'group', 'cell-content'])}>
            <p>N/A</p>
        </div>
    );
}

export default NACell;

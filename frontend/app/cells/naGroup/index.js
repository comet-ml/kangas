// Shows a value, but doesn't Group

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';

const cx = classNames.bind(styles);

const NAGroupCell = ({value, query}) => {

    if (query?.groupBy)
        return (
            <div className={cx(['cell', 'group', 'cell-content'])}>
                <p>N/A</p>
            </div>
    );
    return (
        <div className={cx(['cell', 'group', 'cell-content'])}>
            <p>{value}</p>
        </div>
    );
};

export default NAGroupCell;

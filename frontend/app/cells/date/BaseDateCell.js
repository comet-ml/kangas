import formatValue from '../../../lib/formatValue';

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

const DateCell = ({ value, style }) => {
    return (
            <div className={cx("cell-content")} style={style}>{`${formatValue(
            value,
            'DATETIME'
        )}`}</div>
    );
};

export default DateCell;

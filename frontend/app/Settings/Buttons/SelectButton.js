import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const SelectButton = () => (
    <div className={cx("button-outline")}>
        <img src="/columns_placeholder.png" /> <span>Columns</span>
    </div>
);

export default SelectButton;
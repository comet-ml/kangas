import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const KangasButton = () => (
    <div className={cx("button-outline")}>
        <img src="/favicon.png" />
        <span>Kangas</span>
    </div>
);

export default KangasButton;

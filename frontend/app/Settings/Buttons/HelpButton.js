import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const HelpButton = () => (
	<div className={cx("button-outline")}>
        <span>?</span>
    </div>
);

export default HelpButton;

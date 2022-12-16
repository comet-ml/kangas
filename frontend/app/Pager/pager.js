/* eslint-disable react/jsx-key */

import styles from './Pager.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const Pager = async () => {
    return (
        <div className={cx('pagination')}>
	    Pager
	</div>
    );
};

export default Pager;

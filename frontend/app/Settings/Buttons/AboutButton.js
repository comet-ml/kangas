import styles from './Buttons.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const AboutDialog = ({ status }) => {
    const items = Object.keys(status).map(item => (
	    <li className={cx("kangas-list-item")}>
            <span className={cx("kangas-item")}>{item}</span>: <span className={cx("kangas-value")}>{status[item]}</span>
	    </li>
    ));

    return (
        <div>
            <h1 className={cx("kangas-title")}>&#129432; Kangas DataGrid</h1>
            <hr />
            <p className={cx("kangas-text")}>© 2022 Kangas DataGrid Development Team</p>
            <div className={cx("kangas-text")}>
                {items}
            </div>
            <p className={cx("kangas-text")}>For help, contributions, examples, and discussions, see: <a href="https://www.github.com/comet-ml/kangas" target="_blank">github.com/comet-ml/kangas</a></p>
            <p className={cx("kangas-text")}>Consider giving us a github <span className={cx("kangas-item")}>&#10029;</span>!</p>
        </div>
	)
};

export default AboutDialog;
import Histogram from "../charts/Histogram/Histogram";
import isPrimitive from '../../../lib/isPrimitive';
import formatValue from "../../../lib/formatValue";
import classNames from 'classnames/bind';
import styles from '../Cell.module.scss'

const cx = classNames.bind(styles);

const GroupedFloatCell = ({ value }) => {
    const primitive = isPrimitive(value);
    return (
        <div className={cx(['cell', 'group'])}>
            { primitive && formatValue(value)}
            { !primitive && <Histogram value={value} />}
        </div>
    )
}

export default GroupedFloatCell;
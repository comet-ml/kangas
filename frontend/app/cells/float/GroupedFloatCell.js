import { Suspense } from "react";
import Histogram from "../charts/histogram/Histogram";
import isPrimitive from '../../../lib/isPrimitive';
import formatValue from "../../../lib/formatValue";
import classNames from 'classnames/bind';
import styles from '../Cell.module.scss'

const cx = classNames.bind(styles);

const GroupedFloatCell = ({ value, expanded = false}) => {
    const primitive = isPrimitive(value);
    return (
        <div className={cx(['cell', 'group', 'cell-content'], { expanded })}>
            { primitive && formatValue(value)}
            { !primitive && <Suspense fallback={<>Loading</>}><Histogram value={value} expanded={expanded} /></Suspense>}
        </div>
    );
}

export default GroupedFloatCell;

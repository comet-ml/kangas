import { Suspense } from "react";
import Category from "@kangas/app/cells/charts/category/Category";
import isPrimitive from '@kangas/lib/isPrimitive';
import formatValue from "@kangas/lib/formatValue";
import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';

const cx = classNames.bind(styles);

const GroupedTextCell = ({ value, expanded = false, ssr}) => {
    const primitive = isPrimitive(value);

    return (
        <div className={cx(['cell', 'group', 'cell-content'], { expanded })}>
            { primitive && formatValue(value)}
            { !primitive && <Suspense fallback={<>Loading</>}><Category value={value} expanded={expanded} ssr={ssr} /></Suspense>}
        </div>
    );
}

export default GroupedTextCell;

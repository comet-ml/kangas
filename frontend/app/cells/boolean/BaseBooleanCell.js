"use client";

import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

const BooleanCell = ({ value, style }) => {
    return (
        <div className={cx("cell-content")} style={style}>
            {
                (value === null) ?
                    <>None</> :
                    ((value === 1) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />)
            }
        </div>
    );
};

export default BooleanCell;

'use client';

import { CircularProgress } from '@mui/material';
import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';

const cx = classNames.bind(styles);

const LoadingCell = () => {

    return (
        <div className={cx(['cell', 'group', 'cell-content'])}>
            <CircularProgress />
        </div>
    );
}

export default LoadingCell;

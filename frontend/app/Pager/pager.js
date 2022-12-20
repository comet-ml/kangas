/* eslint-disable react/jsx-key */

import fetchDataGridTotal from '../../lib/fetchDatagridTotal';

import styles from './Pager.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const Pager = async ({query}) => {
    const totalRows = (await fetchDataGridTotal(query)).total;

    const currentPage = Math.floor(query.offset / query.limit) + 1;
    const totalPages = Math.ceil(totalRows / query.limit);
    const maxRow = Math.min(
	query.offset + query.limit,
	totalRows,
    );

    return (
        <div className={cx('pagination')}>
	    Showing {`${query.offset + 1} - ${maxRow} of ${totalRows} rows`}: Page {`${currentPage}  / ${totalPages}`}
	</div>
    );
};

export default Pager;

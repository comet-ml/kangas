import styles from '../Table/Table.module.scss';
import classNames from 'classnames/bind';
import defaultCellSizes from '../../lib/consts/defaultCellSizes';

const cx = classNames.bind(styles)

const Header = ({ columnName }) => {
    return (
        <div>
            {columnName}
        </div>
    )
}

export default Header;
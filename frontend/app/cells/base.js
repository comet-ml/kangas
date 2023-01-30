import styles from './Cell.module.scss';
import classNames from 'classnames/bind';
import CellClient from './baseClient';
import Header from './header';
import cellMap from '../../lib/consts/cellMap';

const cx = classNames.bind(styles);

const HeaderCell = ({ columnName, type }) => {
    return (
        <CellClient columnName={columnName} type={type} isHeader={true}>
            <Header columnName={columnName} />
        </CellClient>
    );
}

const Cell = async ({ value, columnName, type, query, isHeader }) => {
    const Component = cellMap?.[type]?.component;

    if (isHeader) {
        return (
           <HeaderCell columnName={columnName} type={type} grouped={query?.groupBy}/>
        );
    };

    return (
        <CellClient columnName={columnName} type={type} grouped={query?.groupBy}>
            { !!Component && <Component value={value} query={query} />}
            { !Component && <div>{`${value}`}</div> }
        </CellClient>
    );
};

export default Cell;


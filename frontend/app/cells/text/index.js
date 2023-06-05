import Base from './BaseTextCell';
import Grouped from './GroupedTextCell';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalContainer';
import fetchMetadata from '@kangas/lib/fetchMetadata';

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

const TextCell = async ({ value, query, style, ssr, columnName }) => {
    const metadata = await fetchMetadata({
        query: {dgid: query?.dgid, timestamp: query?.timestamp},
        ssr: true,
    });

    const expandedCell = (
        <div className={cx("cell-text-expanded")} style={style} >
            {value}
        </div>
    );


    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query} style={style} metadata={metadata?.[columnName]} />}>
            <Base value={value} query={query} style={style} metadata={metadata?.[columnName]} expanded={true}/>
        </DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} ssr={ssr} />}>
            <Grouped value={value} query={query} expanded={true} ssr={ssr} />
        </DialogueModal>
    );
}

export default TextCell;

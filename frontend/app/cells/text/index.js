import Base from './BaseTextCell';
import Grouped from './GroupedTextCell';
import fetchMetadata from '@kangas/lib/fetchMetadata';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalClient';

const TextCell = async ({ value, query, style, ssr, columnName }) => {
    const metadata = await fetchMetadata({
        query: {dgid: query?.dgid, timestamp: query?.timestamp},
        ssr: true,
    });

    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query} style={style} metadata={metadata?.[columnName]} />}><Base value={value} query={query} style={style} metadata={metadata?.[columnName]} /></DialogueModal>
    );
    else  return (
        <DialogueModal toggleElement={<Grouped value={value} query={query} ssr={ssr} />}><Grouped value={value} query={query} expanded={true} ssr={ssr} /></DialogueModal>
    );
}

export default TextCell;

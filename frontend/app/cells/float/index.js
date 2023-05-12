import { Suspense } from 'react';
import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalContainer';
import fetchMetadata from '@kangas/lib/fetchMetadata';
import Base from './BaseFloatCell';
import Grouped from './GroupedFloatCell';

const FloatCell = async ({ value, query, style, ssr, columnName }) => {
    const metadata = await fetchMetadata({
        query: {dgid: query?.dgid, timestamp: query?.timestamp},
        ssr: true,
    });

    if (!query?.groupBy) return (
            <DialogueModal toggleElement={<Base value={value} query={query} style={style} metadata={metadata?.[columnName]} />}>
            <Base value={value} query={query} style={style} metadata={metadata?.[columnName]} />
        </DialogueModal>
    );
    else return (
        <DialogueModal toggleElement={<Suspense fallback={<>FD</>}><Grouped value={value} query={query} ssr={ssr} /></Suspense>}>
            <Suspense fallback={<>Loading</>}>
                <Grouped value={value} query={query} expanded={true} ssr={ssr} />
            </Suspense>

        </DialogueModal>
    );
};

export default FloatCell;

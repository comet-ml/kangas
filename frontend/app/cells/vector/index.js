import { Suspense } from "react";
import DialogueModal from "../../modals/DialogueModal/DialogueModalClient";

import VectorCellClient from './VectorCellClient'

const VectorCell = ({ value, query, style, ssr }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<VectorCellClient value={value} query={query} style={style} />}>
            <VectorCellClient expanded={true} value={value} query={query} />
        </DialogueModal>
    );
    else return (
        <DialogueModal toggleElement={<Suspense fallback={<>FD</>}><VectorCellClient value={value} query={query} ssr={ssr} /></Suspense>}>
            <Suspense fallback={<>Loading</>}>
                <VectorCellClient value={value} query={query} expanded={true} ssr={ssr} />
            </Suspense>

        </DialogueModal>
    );
};

export default VectorCell;

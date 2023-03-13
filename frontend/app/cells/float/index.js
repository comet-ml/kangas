import { Suspense } from "react";
import DialogueModal from "../../modals/DialogueModal/DialogueModalClient";
import Base from "./BaseFloatCell";
import Grouped from './GroupedFloatCell'

const FloatCell = ({ value, query, style, ssr }) => {
    if (!query?.groupBy) return (
        <DialogueModal toggleElement={<Base value={value} query={query} style={style} />}><Base value={value} query={query} /></DialogueModal>
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

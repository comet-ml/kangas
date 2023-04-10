import { Suspense } from "react";
import DialogueModal from "../../modals/DialogueModal/DialogueModalClient";

import EmbeddingCellClient from './EmbeddingCellClient'
import fetchEmbeddingsAsPCA from '../../../lib/fetchEmbeddingsAsPCA';

const EmbeddingCell = async ({ value, query, style, ssr, columnName }) => {
    let ssrData = null;

    if (!query?.groupBy) {
        ssrData = ssr ? await fetchEmbeddingsAsPCA({dgid: query?.dgid, timestamp: query?.timestamp, columnName, assetId: value?.assetId}, ssr) : false;
    } else {
        ssrData = ssr ? await fetchEmbeddingsAsPCA({dgid: query?.dgid, timestamp: query?.timestamp, columnName, columnValue: value?.columnValue,
                                                    groupBy: value?.groupBy, whereExpr: value?.whereExpr}, ssr) : false;
    }

    return (
          <DialogueModal toggleElement={<Suspense fallback={<>FD</>}><EmbeddingCellClient value={value} query={query} ssr={ssr} columnName={columnName} ssrData={ssrData} /></Suspense>}>
            <Suspense fallback={<>Loading</>}>
                <EmbeddingCellClient value={value} query={query} expanded={true} ssr={ssr} columnName={columnName} ssrData={ssrData} />
            </Suspense>

          </DialogueModal>
        );
};

export default EmbeddingCell;

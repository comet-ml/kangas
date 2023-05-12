'use client';

import fetchTimestamp from "@kangas/lib/fetchTimestamp";
import useQueryParams from "@kangas/lib/hooks/useQueryParams";
import { useCallback, useContext, useEffect, useRef } from "react";
import { ViewContext } from "./contexts/ViewContext";

const Polling = ({ children }) => {
    const { params, updateParams } = useQueryParams();
    const { shouldPoll } = useContext(ViewContext);
    const interval = useRef();

    const checkTimestamp = useCallback(async () => {
        if (!params?.datagrid || !shouldPoll) return;

        const mostRecent = await fetchTimestamp(params.datagrid, false);

        if (params?.timestamp != mostRecent) {
            updateParams({ timestamp: mostRecent })
        }
    }, [params?.datagrid, params?.timestamp, updateParams, shouldPoll])

    useEffect(() => {
        if (!params?.timestamp) {
            checkTimestamp();
        } else {
            if (!!interval.current) clearInterval(interval.current);

            interval.current = setInterval(checkTimestamp, 15000);
        }

        return () => clearInterval(interval.current);
      }, [checkTimestamp, params?.timestamp]);
      
      return (
        <>
            { children }
        </>
      );
};

export default Polling;

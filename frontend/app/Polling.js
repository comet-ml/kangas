'use client';

import fetchTimestamp from "@kangas/lib/fetchTimestamp";
import useQueryParams from "@kangas/lib/hooks/useQueryParams";
import { useCallback, useEffect, useRef } from "react";

const Polling = ({ children }) => {
    const { params, updateParams } = useQueryParams();
    const interval = useRef();

    const checkTimestamp = useCallback(async () => {
        if (!params?.datagrid) return;

        const mostRecent = await fetchTimestamp(params.datagrid, false);

        if (params?.timestamp != mostRecent) {
            updateParams({ timestamp: mostRecent })
        }
    }, [params?.datagrid, params?.timestamp, updateParams])

    useEffect(() => {
        if (!!interval.current) clearInterval(interval.current);

        interval.current = setInterval(checkTimestamp, 3000);

        return () => clearInterval(interval.current);
      }, [checkTimestamp]);
      

      return (
        <>
            { children }
        </>
      )

}

export default Polling;
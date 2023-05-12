'use client';

import fetchTimestamp from "@kangas/lib/fetchTimestamp";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useRef } from "react";
import { ViewContext } from "./contexts/ViewContext";

const Polling = ({ children }) => {
    const { query } = useContext(ViewContext);
    const { shouldPoll } = useContext(ViewContext);
    const interval = useRef();
    const router = useRouter();

    const checkTimestamp = useCallback(async () => {
        if (!query?.dgid) return;

        const mostRecent = await fetchTimestamp(query.datagrid, false);

        if (query?.timestamp != mostRecent) {
            const { pathname, search } = window.location;
            router.replace(`${pathname}${search}`);
        }
    }, [query?.dgid, query?.timestamp, shouldPoll])

    useEffect(() => {
        if (!!interval.current) clearInterval(interval.current);

        interval.current = setInterval(checkTimestamp, 15000);

        return () => clearInterval(interval.current);
    }, [checkTimestamp, query]);
      
      return (
        <>
            { children }
        </>
      );
};

export default Polling;

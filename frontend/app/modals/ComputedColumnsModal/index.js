'use client';

import React, { useRef, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModalContext } from '../../contexts/ModalContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';
import formatQueryArgs from '../../../lib/formatQueryArgs';
import { ConfigContext } from "../../contexts/ConfigContext";
import ComputedColumnsEditor from './ComputedColumnsEditor';
//import setStatus from './Somewhere';

import classNames from 'classnames/bind';
import styles from '../../Settings/SettingsBar.module.scss';
const cx = classNames.bind(styles);

const ComputedColumnsModal = ({ columns, query, completions }) => {
  const { config } = useContext(ConfigContext);
  const { params, updateParams } = useQueryParams();
  const { closeModal } = useContext(ModalContext);
  const [computedColumns, setComputedColumns] = useState();
  const [valid, setValid] = useState(true);

  const setStatus = useCallback((message) => {
    console.log(message);
  });

    useEffect(() => {
        if (query?.computedColumns)
            setComputedColumns(query.computedColumns);
    }, [setComputedColumns, query?.computedColumns]);

  const onChange = useCallback(
    (value) => {
      setComputedColumns(value);
    },
    [setComputedColumns]
  );

  const origJSON = useMemo(() => {
    if (!!query?.computedColumns) {
      return query.computedColumns;
    }
    return {};
  }, [query]);

  const apply = useCallback(
    (close = false) => {
      // Verify that this works, with (or without) filter:
      const queryString = formatQueryArgs({
        dgid: query?.dgid,
        timestamp: query?.timestamp,
        where: query?.whereExpr,
        computedColumns: computedColumns
      });
      fetch(`${config.rootPath}api/filter?${queryString}`, {
        next: { revalidate: 10000 }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.valid) {
            const myParams = {
              cc: JSON.stringify(computedColumns)
            };
            if (
              params.group in origJSON &&
              !(params.group in computedColumns)
            ) {
              myParams.group = undefined;
              myParams.page = undefined;
              myParams.rows = undefined;
            }
            if (params.sort in origJSON && !(params.sort in computedColumns)) {
              myParams.sort = undefined;
            }
            updateParams(myParams);
            if (close) closeModal();
            else {
                setStatus("Successfully applied computed columns to DataGrid");
                setValid(true);
            }
          } else {
            setValid(false);
            if (Object.keys(computedColumns).length === 0) {
              setStatus("Error: filter depends on computed columns; remove it");
            } else if (typeof query?.whereExpr === "undefined") {
              setStatus("Error: fix expression syntax in computed column");
            } else {
              setStatus(
                "Error: fix expression syntax, or remove filter dependency"
              );
            }
          }
        });
    },
    [
      query,
      computedColumns,
      origJSON,
      updateParams,
      params,
      closeModal,
      setStatus,
      config.rootPath
    ]
  );

  return (
    <div className={cx("multi-select-columns")}>
      <div className={cx("title")}>Computed Columns</div>
      <div className={cx("subtitle")}>Add computed columns to the table</div>
      <div className={cx("multi-select-columns-body")}>
        <div>
          <ComputedColumnsEditor
            className={cx("computed-column-textarea")}
            name="computedColumnsTextarea"
            onChange={onChange}
            value={origJSON}
          />
        </div>
        <div className={cx("button-row")}>
          <button className={cx("button-outline")} onClick={() => apply(false)}>
            Apply
          </button>
          <button className={cx("button")} onClick={() => apply(true)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComputedColumnsModal;

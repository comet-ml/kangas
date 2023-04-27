'use client';

import { useState, useCallback, useEffect, useMemo } from "react";
import Select from "react-select";
import DeleteIcon from "@mui/icons-material/Delete";

import classNames from "classnames/bind";
import styles from "./ComputedColumnsModal.module.scss";
const cx = classNames.bind(styles);


const options = [
  { label: "int", value: "INTEGER" },
  { label: "float", value: "FLOAT" },
  { label: "bool", value: "BOOLEAN" },
  { label: "JSON", value: "JSON" },
  { label: "text", value: "TEXT" },
  { label: "date", value: "DATETIME" }
];



const Row = ({ update, value }) => {
  const { name, expr, type } = value;

  const updateName = useCallback((e) => update({ name: e.target.value }), [update]);
  const updateExpr = useCallback((e) => {
    update({ 
      name, 
      expr: e.target.value 
    }
  )}, [update]);
  const updateType = useCallback((e) => {
    update({
      name,
      type: e.value 
    }
  )}, [update]);

  return (
    <div className={cx("computed-columns-row")}>
      <input
        className={cx("cc-input")}
        defaultValue={name}
        onChange={updateName}
      />
      <input
        className={cx("cc-input")}
        defaultValue={expr}
        onChange={updateExpr}
      />
      <div className={cx("cc-input")}>
        <Select
          options={options}
          defaultValue={type}
          onChange={updateType}
        />
      </div>
      <DeleteIcon {/*onClick={() => removeRow(idx)}*/ ...{}} />
    </div>
    )
}

const ComputedColumnsEditor = ({ className, name, onChange, value }) => {
  const [count, setCount] = useState(0);
  const [formRows, setFormRows] = useState([]);

  const [proposedColumns, setProposedColumns] = useState({});

  const displayColumns = useMemo(() => {
    return {
      ...value,
      ...proposedColumns
    }
  }, [proposedColumns, value]);


  const addColumn = useCallback(() => {
    setProposedColumns({
      ...proposedColumns,
      [Object.keys(displayColumns)?.length]: {
        name: `New Columns`,
        expr: "{'row-id'} < 5",
        type: "BOOLEAN"  
      }
    })
  }, [proposedColumns, displayColumns]);

    const update = useCallback((column, idx) => {
      const columns = {
        ...proposedColumns
      }
      columns[idx] = column;
      setProposedColumns({
        ...proposedColumns,
        [idx]: column
      })
    }, [proposedColumns]);

  return (
    <div>
      {Object.keys(displayColumns).map((key, idx) => (
        <Row update={update} value={displayColumns[key]} idx={key} />
      ))}
      <div className={cx("reset")} onClick={addColumn}>
        Add Column
      </div>
      <div>
      </div>
    </div>
  );
};

export default ComputedColumnsEditor;

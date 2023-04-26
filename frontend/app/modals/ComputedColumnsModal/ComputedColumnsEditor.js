'use client';

import { useState, useCallback, useEffect } from "react";
import Select from "react-select";
import DeleteIcon from "@mui/icons-material/Delete";

import classNames from "classnames/bind";
import styles from "../../Settings/SettingsBar.module.scss";
const cx = classNames.bind(styles);

const ComputedColumnsEditor = ({ className, name, onChange, value }) => {
  const [count, setCount] = useState(0);
  const [formRows, setFormRows] = useState([]);

  const options = [
    { label: "int", value: "INTEGER" },
    { label: "float", value: "FLOAT" },
    { label: "bool", value: "BOOLEAN" },
    { label: "JSON", value: "JSON" },
    { label: "text", value: "TEXT" },
    { label: "date", value: "DATETIME" }
  ];

  if (value) {
    // Only set the first time:
    const cc = JSON.parse(value);
    setFormRows(Object.keys(cc).map(key => { return {"name": key, "expr": cc[key]["expr"], "type": cc[key]["type"]}}));
  }

  const makeOnChange = useCallback(() => {
    // Make the JSON string to send to onChange:
    const cc = formRows.map((item) => {
      return { [item["name"]]: { expr: item["expr"], type: item["type"] } };
    });
    onChange(JSON.stringify(cc));
  }, [onChange, formRows]);

  const updateRow = useCallback(
    (idx, field, value) => {
      // update the row with changes on the fly
      const nextRows = formRows.map((v, i) => {
        if (i === idx) {
          v[field] = value;
          return v;
        } else {
          return v;
        }
      });
      setFormRows(nextRows);
      makeOnChange();
    },
    [formRows, setFormRows, makeOnChange]
  );

  const makeRow = useCallback(() => {
    // Make a new dummy row
    setCount(count + 1);
    return {
      name: `New Column ${count + 1}`,
      expr: "{'row-id'} < 5",
      type: "BOOLEAN"
    };
  }, [count, setCount]);

  const appendNewRow = useCallback(() => {
    // Append a new new row
    setFormRows([...formRows, makeRow()]);
    makeOnChange();
  }, [setFormRows, makeOnChange, formRows, makeRow]);

  const removeRow = useCallback(
    (idx) => {
      // Remove a row:
      const rows = formRows.filter((v, fidx) => fidx !== idx);
      setFormRows(rows);
      makeOnChange();
    },
    [setFormRows, makeOnChange, formRows]
  );

  return (
    <div>
      {formRows.map((row, idx) => (
        <div
          style={{
            display: "flex",
            alignContent: "stretch",
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "stretch"
          }}
          key={`cc-row-${idx}`}
          className={cx("computed-columns-row")}
        >
          <input
            key={`cc-name-${idx}`}
            className={cx("cc-name")}
            style={{ width: "25%" }}
            value={formRows[idx]["name"]}
            onChange={(event) => updateRow(idx, "name", event.target.value)}
          ></input>
          <input
            key={`cc-expr-${idx}`}
            className={cx("cc-type")}
            style={{ width: "25%" }}
            value={formRows[idx]["expr"]}
            onChange={(event) => updateRow(idx, "expr", event.target.value)}
          ></input>
          <div style={{ width: "25%" }}>
            <Select
              key={`cc-type-${idx}`}
              options={options}
              value={options.find(
                (item) => item["value"] == formRows[idx]["type"]
              )}
              onChange={(event) => updateRow(idx, "type", event.value)}
            />
          </div>
          <DeleteIcon key={`cc-delete-${idx}`} onClick={() => removeRow(idx)} />
        </div>
      ))}
      <div className={cx("reset")} onClick={() => appendNewRow()}>
        Add Column
      </div>
    </div>
  );
};

export default ComputedColumnsEditor;

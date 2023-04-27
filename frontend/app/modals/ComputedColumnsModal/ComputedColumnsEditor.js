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

  useEffect(() => {
    if (value) {
	// Only set the first time:
	// value is {key: {"expr": , "type": }}
	const cc = Object.keys(value).map(key => {
            return {name: key, expr: value[key]["expr"] || value[key]["field_expr"], type: value[key]["type"] };
        });
	// formRows is [{"name":, "expr": , "type"}]
	setFormRows(cc);
    }
  }, [value, setFormRows]);

  const makeOnChange = useCallback((rows) => {
      // Make the JSON string to send to onChange:
      // rows/formRows is [{"name":, "expr": , "type"}]
      const cc = {};
      rows.forEach(item => {
          cc[item["name"]] = {expr: item["expr"], type: item["type"] };
      });
      // cc is {key: {"expr": , "type": }}
      onChange(cc);
      setFormRows(rows);
  }, [onChange, setFormRows]);

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
      makeOnChange(nextRows);
    },
      [makeOnChange, formRows]
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
    makeOnChange([...formRows, makeRow()]);
  }, [makeOnChange, formRows, makeRow]);

    const removeRow = useCallback((idx) => {
	// Remove a row:
	const rows = formRows.filter((v, fidx) => fidx !== idx);
	makeOnChange(rows);
    }, [formRows, makeOnChange]);

  return (
    <div>
      <div style={{ overflowY: 'scroll', maxHeight: '150px' }}>
        {formRows.map((row, idx) => (
          <div
            style={{
              display: "flex",
              alignContent: "stretch",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "stretch",
              paddingBottom: '5px'
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
                  (item) => item["value"] === formRows[idx]["type"]
                )}
                onChange={(event) => updateRow(idx, "type", event.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#5155f5', cursor: 'pointer' }}>
              <DeleteIcon key={`cc-delete-${idx}`} onClick={() => removeRow(idx)} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ paddingTop: '5px', paddingBottom: '10px', fontSize: '14px', color: '#5155F5', cursor: 'pointer'}} className={cx("reset")} onClick={() => appendNewRow()}>
        Add Column
      </div>
    </div>
  );
};

export default ComputedColumnsEditor;

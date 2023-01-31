'use client';

import React, { MouseEventHandler, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Select, { components } from 'react-select';
import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ModalContext } from '../../contexts/ModalContext';
import useQueryParams from '../../../lib/hooks/useQueryParams';

import classNames from 'classnames/bind';
import styles from '../../Settings/SettingsBar.module.scss';
const cx = classNames.bind(styles);


// Most of this is taken directly from https://github.com/codercodingthecode/react-select/blob/update-sortable/docs/examples/MultiSelectSort.tsx
// The code is a lot, but the gist is that we use react-select to get all of the nice interactivity we need in our <select> element. Unfortunately,
// react-select doesn't provide the drag-and-drop sorting interface we use, so we use @dnd-kit for that. To make the two libraries work together,
// we have to pass our <Select> component as a child of our <DndContext> component tree. To prevent this from causing errors within <Select>,
// we override several of the internal components <Select> uses. react-select provides us an interface for doing this. Every component defined before
// MultiSelectSort is just a react-select internal component that we are redefining to accept the props that @dnd-kit passes through.

const MultiValue = (props) => {
    const onMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const innerProps = { ...props.innerProps, onMouseDown };
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({
            id: props.data.id,
        });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div style={style} ref={setNodeRef} {...attributes} {...listeners}>
            <components.MultiValue {...props} innerProps={innerProps} />
        </div>
    );
};

const MultiValueContainer = (props) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'droppable',
    });

    const style = {
        color: isOver ? 'green' : undefined,

    };

    return (
        <div style={style} ref={setNodeRef}>
            <components.MultiValueContainer {...props} />
        </div>
    );
};

const MultiValueRemove = (props) => {
    return (
        <components.MultiValueRemove
            {...props}
            innerProps={{
                onPointerDown: (e) => e.stopPropagation(),
                ...props.innerProps,
            }}
        >
            <div style={{
                width: '100%',
                height: '100%',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
                }}
            >
                x
            </div>
        </components.MultiValueRemove>
    );
};

const Menu = (props) => (
	<components.Menu className={cx("react-select-list")} {...props} />
);

const MultiColumnSelectModal = ({ columns = {} }) => {
    const { params, updateParams } = useQueryParams();
    const [selected, setSelected] = useState([]);
    const { closeModal } = useContext(ModalContext); 
    const onChange = useCallback((selectedOptions) => setSelected([...selectedOptions], []));

    const onSortEnd = useCallback((event) => {
        const { active, over } = event;

        if (!active || !over) return;

        setSelected((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }, []);

    //const columnNames = useMemo(() => {Object.keys(columns) ?? [], [columns]);

    const options = useMemo(
        () =>
            columns?.map((col, i) => {
                // For dropdown selectors, we add an empty cell at id: 0, hence the i + 1 below
                return { id: i + 1, label: col, value: col };
            }),
        [columns]
    );

    const resetSelected = useCallback(() => setSelected(options), [options]);

    const update = useCallback(() => {
        if (selected.length > 0) {
            const parsedOptions = selected.map((col) => col.value);
            updateParams({
                select: parsedOptions.join(',')
            });
        } else {
            updateParams({
                select: undefined
            });
        }
        closeModal();
    }, [selected, updateParams, closeModal]);

    useEffect(() => {
        const preselected = params?.select?.split(',').map(col => {
            return options.find((option) => option.value.toLowerCase() === col.toLowerCase() )
        });

        if (preselected?.length) setSelected([ ...preselected ]);
        else setSelected([ ...options ])
    }, [options, params?.select]);

    // Note: react-select styling: https://react-select.com/styles
    const customStyles = useMemo(() => {
        return {
            valueContainer: (provided, state) => ({
                ...provided,
                overflow: 'auto',
                padding: '5px 6px'
            }),
            multiValue: (provided, state) => ({
                ...provided,
                backgroundColor: '#E5E5FE',
                alignItems: 'center'
            }),
            multiValueLabel: (provided, state) => ({
                ...provided,
                color: '#5155F5',
                fontSize: '12px',
                fontWeight: '400',
                textTransform: 'uppercase'
            }),
            multiValueRemove: (provided, state) => ({
                ...provided,
                backgroundColor: '#AFB0FB',
                borderRadius: '100%',
                height: '14px',
                width: '14px',
                marginLeft: '8px',
                marginRight: '8px',
                fontSize: '10px',
                color: 'white',
                display: 'flex',
                alignItems: 'center'
            })
        }
     }, []);

    return (
            <div className={cx("multi-select-columns")}>
            <div className={cx("title")}>
                Column Selection & Ordering
            </div>
            <div className={cx("subtitle")}>
                Add and remove column tags to update the table
            </div>
            <div className={cx("multi-select-columns-body")}>
                <DndContext
                    modifiers={[restrictToParentElement]}
                    onDragEnd={onSortEnd}
                >
                    <SortableContext
                        items={selected}
                        strategy={horizontalListSortingStrategy}
                    >
                        <Select
                            styles={customStyles}
                            distance={4}
                            isMulti
                            options={options}
                            value={selected}
                            onChange={onChange}
                            components={{
                                MultiValue,
                                MultiValueContainer,
                                MultiValueRemove,
                                Menu,
                            }}
                            closeMenuOnSelect={false}
                        />
                    </SortableContext>
                </DndContext>
            <div className={cx("button-row")}>
            <div className={cx("reset")} onClick={resetSelected}>Reset Defaults</div>
            <button className={cx('button')} onClick={update}>Done</button>
                </div>
            </div>
        </div>

    );
};

export default MultiColumnSelectModal;

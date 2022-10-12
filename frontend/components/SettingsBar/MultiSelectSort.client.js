import React, { MouseEventHandler, useCallback } from 'react';
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
        transition,
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
        />
    );
};

const Menu = (props) => (
    <components.Menu className="react-select-list" {...props} />
);

const MultiSelectSort = ({ options, update, defaults }) => {
    const [selected, setSelected] = React.useState(options);

    const onChange = (selectedOptions) => setSelected([...selectedOptions]);

    const onSortEnd = (event) => {
        const { active, over } = event;

        if (!active || !over) return;

        setSelected((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const updated = useCallback(() => update(selected), [selected]);

    const customStyles = {
        valueContainer: (provided, state) => ({
            ...provided,
            overflow: 'auto',
        }),
    };

    return (
        <>
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
                        options={defaults}
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
            <button onClick={updated}>Save Changes</button>
        </>
    );
};

export default MultiSelectSort;

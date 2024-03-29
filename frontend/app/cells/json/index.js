'use client';

// Need to run in client because of JsonViewer uses useEffect

import DialogueModal from '@kangas/app/modals/DialogueModal/DialogueModalContainer';
import { JsonViewer } from '@textea/json-viewer';

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';

const cx = classNames.bind(styles);

const JSONCell = ({ value, query, style }) => {

    const cell = (
            <div className={cx("cell-content")} style={style}>
                <pre>
                    {JSON.stringify(value)}
                </pre>
            </div>
    );

    const cellExpanded = (
            <div className={cx("cell-json-expanded")} style={style}>
                            <JsonViewer value={value}
                                rootName={false}
                                theme="light"
                                indentWidth={4}
                                defaultInspectDepth={1}
                                collapseStringsAfterLength={15}
                                enableClipboard={true}
                                displayObjectSize={true}
                                displayDataTypes={false}
                                objectSortKeys={true}
                            />
            </div>
    );


    if (!!query?.groupBy)
        return (<></>);
    else
        return (
            <DialogueModal toggleElement={cell}>
                {cellExpanded}
            </DialogueModal>
        );

};

export default JSONCell;

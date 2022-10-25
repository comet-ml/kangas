# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2022 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import base64

from google.colab import output
from IPython.display import Javascript, display

from .server.queries import (
    select_asset,
    select_asset_metadata,
    select_category,
    select_histogram,
)


def _py_fetch_metadata(dgid, assetId):
    result = select_asset_metadata(dgid, assetId)
    return result


def _py_fetch_asset(dgid, assetId):
    result = select_asset(dgid, assetId, False)
    encoded = base64.b64encode(result)
    return encoded


def _py_fetch_histogram(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    where_description,
    computed_columns,
    where_expr,
):
    result = select_histogram(
        dgid,
        group_by,
        where,
        column_name,
        column_value,
        where_description,
        computed_columns,
        where_expr,
    )
    return result


def _py_fetch_category(
    dgid,
    group_by,
    where,
    column_name,
    column_value,
    where_description,
    computed_columns,
    where_expr,
):
    result = select_category(
        dgid,
        group_by,
        where,
        column_name,
        column_value,
        where_description,
        computed_columns,
        where_expr,
    )
    return result


def init_colab(port, width, height, qvs):
    output.register_callback("_py_fetch_metadata", _py_fetch_metadata)
    output.register_callback("_py_fetch_asset", _py_fetch_asset)
    output.register_callback("_py_fetch_histogram", _py_fetch_histogram)
    output.register_callback("_py_fetch_category", _py_fetch_category)
    display(
        Javascript(
            """
(async ()=>{{
    fm = document.createElement('iframe');
    fm.src = (await google.colab.kernel.proxyPort({port})) + '{qvs}';
    fm.width = '{width}';
    fm.height = '{height}';
    fm.frameBorder = 0;
    document.body.append(fm);
    window.addEventListener("message", async (e) => {{
        const {{ type, targetId }} = e.data;
        if (type === 'metadata') {{
            const result = await google.colab.kernel.invokeFunction(
                '_py_fetch_metadata',
                [e.data.dgid, e.data.assetId],
                {{}});
            const message = JSON.parse(result.data?.['text/plain'].slice(1, -1));
            message['messageType'] = 'metadata';
            message['targetId'] = targetId;
            fm.contentWindow.postMessage(message, "*");
        }} else if (type === 'asset') {{
            const result = await google.colab.kernel.invokeFunction(
                '_py_fetch_asset',
                [e.data.dgid, e.data.assetId],
                {{}});
            const srcString = result.data?.['text/plain'].slice(2, -1);
            const message = {{
                src: srcString,
                messageType: 'asset',
                targetId
            }};
            fm.contentWindow.postMessage(message, "*");
        }} else if (type === 'histogram') {{
            const {{ dgid, groupBy, where, columnName, columnValue, where_description, computed_columns, whereExpr }} = e.data
            const result = await google.colab.kernel.invokeFunction(
                '_py_fetch_histogram',
                [dgid, groupBy, where, columnName, columnValue, where_description, computed_columns, whereExpr],
                {{}}
            )
            const message = {{
                raw: result.data?.['text/plain'],
                messageType: 'histogram',
                targetId
            }};
            fm.contentWindow.postMessage(message, "*");
        }} else if (type === 'category') {{
            const {{ dgid, groupBy, where, columnName, columnValue, where_description, computed_columns, whereExpr }} = e.data
            const result = await google.colab.kernel.invokeFunction(
                '_py_fetch_category',
                [dgid, groupBy, where, columnName, columnValue, where_description, computed_columns, whereExpr],
                {{}}
            )
            const message = {{
                raw: result.data?.['text/plain'],
                messageType: 'category',
                targetId
            }};
            fm.contentWindow.postMessage(message, "*");
        }}

    }}, false);
}})();
""".format(
                port=port, width=width, height=height, qvs=qvs
            )
        )
    )

#!/usr/bin/env python
# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2023 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import argparse
import datetime
import json
import logging
import os
import random
import sys
import time
from multiprocessing.pool import ThreadPool

import requests

from kangas import get_localhost

LOGGER = logging.getLogger(__name__)
ADDITIONAL_ARGS = False

try:
    import colorama
except ImportError:
    LOGGER.info("colorama is not available; colors disabled")
    colorama = None


class Console:
    def __init__(self, colorama):
        self.colorama = colorama
        if self.colorama:
            # Fore: BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE, RESET.
            # Back: BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE, RESET.
            # Style: DIM, NORMAL, BRIGHT, RESET_ALL
            self.colorama.init(autoreset=True)
            self.colors = {
                "k": self.colorama.Fore.BLACK,
                "r": self.colorama.Fore.RED,
                "g": self.colorama.Fore.GREEN,
                "y": self.colorama.Fore.YELLOW,
                "b": self.colorama.Fore.BLUE,
                "m": self.colorama.Fore.MAGENTA,
                "c": self.colorama.Fore.CYAN,
                "w": self.colorama.Fore.WHITE,
            }
            base_colors = list(self.colors.keys())
            self.colors["/"] = self.colorama.Style.RESET_ALL
            for key in base_colors:
                self.colors[key + "*"] = self.colors[key] + self.colorama.Style.BRIGHT
            for key in base_colors:
                self.colors[key + "-"] = self.colors[key] + self.colorama.Style.DIM
        else:
            self.colors = {
                "k": "",
                "r": "",
                "g": "",
                "y": "",
                "b": "",
                "m": "",
                "c": "",
                "w": "",
            }
            base_colors = list(self.colors.keys())
            self.colors["/"] = ""
            for key in base_colors:
                self.colors[key + "*"] = ""
            for key in base_colors:
                self.colors[key + "-"] = ""

    def colorize(self, text):
        for key in self.colors:
            text = text.replace("<" + key + ">", self.colors[key])
        return text

    def display(self, *args, **kwargs):
        args = [self.colorize(str(arg)) for arg in args]
        print(*args, **kwargs)

    def flush(self):
        sys.stdout.flush()


console = Console(colorama)


def get_parser_arguments(parser):
    parser.add_argument("dgid", type=str, default=None, nargs="?")
    parser.add_argument("--port", type=int, default=4001)
    parser.add_argument("--host", type=str, default=None)
    parser.add_argument("--protocol", type=str, default="http")
    # CLI arguments:
    parser.add_argument("--debug", action="store_true", default=False)
    parser.add_argument("--width", type=int, default=None)
    # Query arguments:
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--group-by", type=str, default=None)
    parser.add_argument("--where-expr", type=str, default=None)
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--sort-by", type=str, default=None)
    parser.add_argument("--sort-desc", action="store_true", default=False)
    parser.add_argument("--select", nargs="+", type=str, default=[])
    parser.add_argument("--query-type", type=str, default="query-page")
    parser.add_argument("--column-name", type=str, default=None)
    parser.add_argument("--column-value", type=str, default=None)
    parser.add_argument("--column-offset", type=int, default=0)
    parser.add_argument("--column-limit", type=int, default=None)
    parser.add_argument("--asset-id", type=str, default=None)
    parser.add_argument("--computed-columns", type=str, default=None)


def get_column_value(item):
    if isinstance(item, dict):
        return item["assetId"]
    elif item is None:
        return "NULL"
    else:
        return item


def post(args, endpoint):
    headers = {
        "Content-Type": "application/json;charset=utf-8",
    }
    host = args.host if args.host is not None else get_localhost()
    protocol = args.protocol if args.protocol is not None else "http"
    url = "%s://%s:%s/datagrid/%s" % (protocol, host, args.port, endpoint)
    data = {
        "dgid": args.dgid,
        "offset": args.offset,
        "groupBy": args.group_by,
        "whereExpr": args.where_expr,
        "sortBy": args.sort_by,
        "limit": args.limit,
        "sortDesc": args.sort_desc,
        "select": args.select,
        "queryType": args.query_type,
        "columnName": args.column_name,
        "columnValue": args.column_value,
        "columnOffset": args.column_offset,
        "columnLimit": args.column_limit,
        "assetId": args.asset_id,
        "computedColumns": json.loads(args.computed_columns)
        if args.computed_columns
        else None,
    }
    start_time = time.time()
    response = requests.post(url, headers=headers, data=json.dumps(data))
    if args.debug:
        console.display("POST: <r>complete in %s seconds" % (time.time() - start_time))
    response.raise_for_status()
    retval = response.json()
    if args.debug:
        print(retval)
    return retval


def get(args, endpoint):
    headers = {
        "Content-Type": "application/json;charset=utf-8",
    }
    host = args.host if args.host is not None else get_localhost()
    protocol = args.protocol if args.protocol is not None else "http"
    url = "%s://%s:%s/datagrid/%s" % (protocol, host, args.port, endpoint)
    data = {
        "dgid": args.dgid,
        "assetId": args.asset_id,
    }
    start_time = time.time()
    response = requests.get(url, headers=headers, data=json.dumps(data))
    if args.debug:
        console.display("GET: <r>complete in %s seconds" % (time.time() - start_time))
    response.raise_for_status()
    return response.json()


def tree(positions, *parts):
    prefix = ""
    for p, ptotal in positions[:-1]:
        if p == ptotal - 1:
            prefix += "    "
        else:
            prefix += "│   "
    n, total = positions[-1]
    if n == total - 1:
        stem = "└── "
    else:
        stem = "├── "
    item = "/".join(parts)
    if len(parts) == 4:
        item = "<g>" + item
    elif len(parts) == 3:
        item = "<w->" + item
    elif len(parts) == 2:
        item = "<y>" + item
    else:
        item = "<b>" + item
    return "%s%s%s" % (prefix, stem, item)


def viewer(parsed_args, remaining=None):
    if parsed_args.debug:
        table_detail(parsed_args)
    else:
        try:
            table_detail(parsed_args)
        except KeyboardInterrupt:
            pass
        except Exception as exc:
            print("Error:", exc)


def table_detail(parsed_args):
    return query(parsed_args)


def query(parsed_args):
    if parsed_args.dgid is None:
        dg_list = get(parsed_args, "list")
        print("\n".join([item["value"] for item in dg_list]))
        return
    else:
        table = post(parsed_args, parsed_args.query_type)
        total = post(parsed_args, "query-total")["total"]

    if parsed_args.width:
        MAX_WIDTH = parsed_args.width
    else:
        MAX_WIDTH, _ = os.get_terminal_size(0)
        MAX_WIDTH = MAX_WIDTH - 10

    if "ncols" in table:
        selected = parsed_args.select if parsed_args.select else table["columns"]
        references = []
        width = max(min(int(MAX_WIDTH / len(selected)), MAX_WIDTH), 10)
        if parsed_args.debug:
            for c in range(table["ncols"]):
                if table["columns"][c] in selected:
                    console.display(
                        display(table["columns"][c], width, f="<g>"), end=""
                    )
            console.display()
            for c in range(table["ncols"]):
                if table["columns"][c] in selected:
                    console.display(display("=" * MAX_WIDTH, width, f="<y>"), end="")
            console.display()
        # Convert from dict format to list:
        table["rows"] = [
            [row[column_name] for column_name in table["columns"]]
            for row in table["rows"]
        ]
        for r in range(table["nrows"]):
            for c in range(table["ncols"]):
                if isinstance(table["rows"][r][c], dict):
                    if "columnName" in table["rows"][r][c] and table["rows"][r][c][
                        "columnName"
                    ].endswith("--metadata"):
                        table["rows"][r][c] = "N/A"
                    elif "columnName" in table["rows"][r][c] and table["rows"][r][c][
                        "columnName"
                    ].startswith("_"):
                        table["rows"][r][c] = "N/A"
                    else:
                        json_value = table["rows"][r][c]
                        if "type" in json_value and json_value["type"].endswith(
                            "-group"
                        ):
                            references.append(table["rows"][r][c])
                            table["rows"][r][c] = "&& [%s]" % len(references)
                elif table["columnTypes"][c] == "DATETIME":
                    if table["rows"][r][c]:
                        table["rows"][r][c] = datetime.datetime.fromtimestamp(
                            table["rows"][r][c]
                        )
                if table["columns"][c] in selected and parsed_args.debug:
                    console.display(
                        display(table["rows"][r][c], width, f="<b>"), end=""
                    )
            if parsed_args.debug:
                console.display()
        if parsed_args.debug:
            console.display(
                "Showing {} matches out of {}".format(table["nrows"], total)
            )
            console.display()
            console.display("Cell details:")
            for r, reference in enumerate(references):
                console.display("[%s] - %s" % (r + 1, reference))
            console.display()
            console.display("Links:")
        links = []
        for r, reference in enumerate(references):
            env = {
                "dgid": parsed_args.dgid,
                "debug": parsed_args.debug,
                "where_expr": parsed_args.where_expr,
                "asset_id": reference["assetId"]
                if (isinstance(reference, dict) and "assetId" in reference)
                else None,
                "computed_columns": str(parsed_args.computed_columns)
                if parsed_args.computed_columns
                else None,
                "port": parsed_args.port,
                "host": parsed_args.host
                if parsed_args.host is not None
                else get_localhost(),
                "protocol": parsed_args.protocol
                if parsed_args.protocol is not None
                else "http",
            }
            link = "kangas viewer {dgid} --query-type {query_type} --group-by {link_group_by} --column-name {link_column_name} --column-value '{link_column_value}' --where-expr \"{where_expr}\" --computed-columns {computed_columns}"
            if reference["type"] == "asset":
                link = "{protocol}://{host}:{port}/datagrid/download?dgid={dgid}&assetId={asset_id}"
                env["query_type"] = "asset"
                env["link_asset_id"] = reference["assetId"]
                env["link"] = link
            elif reference["type"] == "float-group":
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["query_type"] = "histogram"
            elif reference["type"] == "boolean-group":
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["query_type"] = "category"
            elif reference["type"] == "numeric-group":
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["query_type"] = "histogram"
            elif reference["type"] == "row-group":
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["query_type"] = "histogram"
            elif reference["type"] == "integer-group":
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["query_type"] = "category"
            elif reference["type"] == "text-group":
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["query_type"] = "category"
            elif reference["type"] == "datetime-group":
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["query_type"] = "histogram"
            elif reference["type"] == "asset-group":
                link = "kangas viewer {dgid} --query-type asset-group --group-by {link_group_by} --column-name {link_column_name} --column-value '{link_column_value}' --column-offset {link_column_offset} --column-limit {link_column_limit} --where-expr \"{where_expr}\" --computed-columns {computed_columns}"
                env["link_group_by"] = reference["groupBy"]
                env["link_column_name"] = reference["columnName"]
                env["link_column_value"] = get_column_value(reference["columnValue"])
                env["link_column_offset"] = 0
                env["link_column_limit"] = None
                env["query_type"] = "asset-group"
            else:
                raise Exception("unknown reference response: %s" % reference)
            link = link.format(**env)
            if parsed_args.debug:
                console.display("[%s] - %s" % (r + 1, link))
            if reference["type"] == "asset":
                links.append([r, reference["type"], link])
            else:
                links.append([r, reference["type"], env])

        # And finally, get all and make final rendered table:
        # request cells in parallel:

        ref_args = []
        for line in links:
            r, link_type, env = line
            if link_type != "asset":
                link_parsed_args = (r, "run", argparse.Namespace(**make_args(env)))
            else:
                link_parsed_args = (r, "link", env)  # the actual link
            ref_args.append(link_parsed_args)

        def process_args(ref_args):
            r, type, args = ref_args
            if "query_type" in args:
                query_type = args.query_type
            else:
                query_type = "query-page"
            if type == "link":
                return (r, args)
            else:
                return (r, post(args, query_type))

        results = []
        if parsed_args.debug:
            for args in ref_args:
                results.append(process_args(args))
        else:
            with ThreadPool(20) as pool:
                results.extend(pool.map(process_args, ref_args))

        # Show results
        if parsed_args.debug:
            console.display("Results:")
            for r, result in results:
                console.display("[%s] - %s" % (r + 1, result))

        ref_map = {}
        for r, result in results:
            if isinstance(result, dict):
                link_json = result
                string_repr = process_result(link_json, width)
            else:
                string_repr = result
            ref_map[r] = string_repr

        # Finally, show table again with updated cells:
        ref_count = 0
        for c in range(table["ncols"]):
            if table["columns"][c] in selected:
                console.display(display("=" * MAX_WIDTH, width, f="<y>"), end="")
        console.display()
        for c in range(table["ncols"]):
            if table["columns"][c] in selected:
                console.display(display(table["columns"][c], width, f="<g>"), end="")
        console.display()
        for c in range(table["ncols"]):
            if table["columns"][c] in selected:
                console.display(display("=" * MAX_WIDTH, width, f="<y>"), end="")
        console.display()
        # First replace cells with references:
        for r in range(table["nrows"]):
            for c in range(table["ncols"]):
                if isinstance(table["rows"][r][c], str) and table["rows"][r][
                    c
                ].startswith("&& ["):
                    table["rows"][r][c] = str(ref_map[ref_count])
                    ref_count += 1
                else:
                    table["rows"][r][c] = str(table["rows"][r][c])
        # Next, find max height of each row:
        row_heights = []
        for r in range(table["nrows"]):
            height = 1
            for c in range(table["ncols"]):
                if table["columns"][c] in selected:
                    height = min(max(height, len(table["rows"][r][c].split("\n"))), 10)
            row_heights.append(height)
        # Finally, display them
        show_dividers = (max(row_heights) > 1) if row_heights else False
        for r in range(table["nrows"]):
            for row in range(row_heights[r]):
                for c in range(table["ncols"]):
                    if table["columns"][c] in selected:
                        console.display(
                            display(table["rows"][r][c], width, row), end=""
                        )
                console.display()
            if show_dividers:
                for c in range(table["ncols"]):
                    if table["columns"][c] in selected:
                        console.display(display("-" * width, width, 0, f="<y>"), end="")
                console.display()
        console.display("Showing {} matches out of {}".format(table["nrows"], total))

    else:
        console.display(table)


def process_result(link_json, width):
    histogram = "  _▁▂▃▄▅▆▇"
    if link_json["type"] == "verbatim":
        return link_json["value"]
    elif link_json["type"] == "asset-group":
        return "\n".join(link_json["values"])
    elif link_json["type"] == "histogram":
        max_value = max(link_json["bins"])
        bin_count = len(link_json["bins"])
        if max_value != 0:
            retval = [
                histogram[min(int((p / max_value) * bin_count), bin_count - 1)]
                for p in link_json["bins"]
            ]
            while len(retval) < width:
                pick = random.choice(range(len(retval)))
                char = retval[pick]
                retval.insert(pick, char)
            return "<r>" + ("".join(retval))
        else:
            return ""

    elif link_json["type"] == "category":
        # First, find the longest label, max value:
        label_width = 1
        max_value = -10000
        for key in link_json["values"]:
            label_width = max(label_width, len(key))
            max_value = max(max_value, link_json["values"][key])
        rows = []
        for key in sorted(link_json["values"]):
            label = ("%-" + str(label_width) + "s") % key
            bar = "█" * int((link_json["values"][key] / max_value) * width)
            rows.append("<w->%s <b>%s" % (label, bar))
        return "\n".join(rows)
    else:
        return link_json["type"]


def make_args(args):
    # Defaults
    parsed_args = {
        "offset": 0,
        "limit": 10,
        "where_expr": None,
        "order_by": None,
        "sort_by": None,
        "sort_desc": False,
        "select": [],
        "query_type": "query-page",
        "column_name": None,
        "column_value": None,
        "column_offset": 0,
        "column_limit": None,
        "port": 4001,
    }
    for arg, value in args.items():
        if arg.startswith("link_"):
            arg = arg[5:]
        parsed_args[arg] = value
    return parsed_args


def get_slice(text, width):
    # get no more than width chars
    retval = ""
    state = None
    length = 0
    for char in text:
        if state == "skip":
            if char == ">":
                state = None
        elif char == "<":
            state = "skip"
        else:
            length += 1
        retval += char
        if length == width:
            break
    return retval + (" " * (width - length))


def format_width(text, width):
    # Don't count format strings in width
    return ("%-" + str(width) + "s") % get_slice(text, width)


def display(column, width, row=0, f=""):
    if isinstance(column, dict) and "type" in column:
        column = column["type"].upper()
    elif column in ["None", None]:
        column = ""
    else:
        column = str(column)

    if "\n" in column:
        rows = column.split("\n")
        if row < len(rows):
            return "<y>|</>" + f + format_width(rows[row], width)
        else:
            return "<y>|</>" + f + (" " * width)
    else:
        if row == 0:
            return "<y>|</>" + f + format_width(column, width)
        else:
            return "<y>|</>" + f + (" " * width)


def main(args):
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    get_parser_arguments(parser)
    parsed_args, remaining = parser.parse_known_args(args)

    viewer(parsed_args, remaining)


if __name__ == "__main__":
    main(sys.argv[1:])

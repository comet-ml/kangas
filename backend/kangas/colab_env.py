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

from IPython.display import Javascript, display


def init_colab(port, width, height, qvs):
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
}})();
""".format(
                port=port, width=width, height=height, qvs=qvs
            )
        )
    )

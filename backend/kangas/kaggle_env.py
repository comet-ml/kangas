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

import getpass

from pyngrok import ngrok


def init_kaggle(port, auth_token):
    # Check to see if the token is in ~/.ngrok2/ngrok.yml
    # authtoken: ...
    # before asking:
    auth_token = getpass.getpass("Kaggle Authorization Token:")

    ngrok.set_auth_token(auth_token)
    tunnel = ngrok.connect(port, "http")
    return tunnel

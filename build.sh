#!/bin/bash
SCRIPT_PATH=$(cd "$(dirname "$0")"; pwd);
cd ${SCRIPT_PATH}

echo ${SCRIPT_PATH}

echo pwd

ls ./node_modules

./node_modules/.bin/6to5 src --out-dir dist --modules umd -r
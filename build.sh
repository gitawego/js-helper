#!/bin/bash
SCRIPT_PATH=$(cd "$(dirname "$0")"; pwd);
cd ${SCRIPT_PATH}

echo ${SCRIPT_PATH}

mkdir -p dist
rm -rf dist/*

./node_modules/.bin/babel src --out-dir dist --modules umd -r

#!/bin/bash
cd /home/siwasoft/siwasoftweb
source /home/siwasoft/siwasoft/.venv/bin/activate
uvicorn siwasoft.app:app --host 0.0.0.0 --port 8000

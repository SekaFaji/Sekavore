"""Compatibility entrypoint: UI coverage moved to layout_v010.py."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('layout_v010.py')))

"""Legacy layout-test entrypoint: run the latest maintained layout assertions."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("layout_v011.py")),run_name="__main__")

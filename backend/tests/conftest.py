import sys
import os

# Ensure the backend root is importable when running pytest from inside tests/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

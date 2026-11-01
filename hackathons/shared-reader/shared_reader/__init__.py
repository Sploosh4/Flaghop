"""Project-scoped shared artifact processing for Cipher Watch and Hash Watch."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT/'cipher-watch'),str(ROOT/'hash-watch')]

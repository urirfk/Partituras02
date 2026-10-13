from typing import Literal

from pydantic import BaseModel, Field

MeasuresPerSystem = Literal[1, 2, 3, 4]
StaffScale = Literal["normal", "large", "extra-large"]
ChordNotation = Literal["latin", "american"]


class ScoreDisplayConfigSchema(BaseModel):
    measures_per_system: MeasuresPerSystem = 2
    show_note_names: bool = True
    show_accidentals: bool = True
    show_fingerings: bool = True
    show_chords: bool = True
    show_lyrics: bool = True
    scale: StaffScale = "large"
    transposition_semitones: int = Field(default=0, ge=-12, le=12)
    chord_notation: ChordNotation = "latin"


class PDFExportOptionsSchema(BaseModel):
    orientation: Literal["portrait", "landscape"] = "portrait"
    page_size: Literal["A4", "letter"] = "A4"
    systems_per_page: int = Field(default=3, ge=1, le=8)
    left_margin_mm: float = Field(default=15.0, ge=5.0, le=40.0)
    right_margin_mm: float = Field(default=15.0, ge=5.0, le=40.0)
    include_header_on_every_page: bool = False

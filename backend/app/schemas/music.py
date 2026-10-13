from typing import List, Literal, Optional

from pydantic import BaseModel, Field

SolfeggioNote = Literal["do", "re", "mi", "fa", "sol", "la", "si"]
Accidental = Literal["natural", "sharp", "flat", "double-sharp", "double-flat"]
Step = Literal["C", "D", "E", "F", "G", "A", "B"]
DurationType = Literal["whole", "half", "quarter", "eighth", "16th", "32nd"]
Fingering = Literal[1, 2, 3, 4, 5]
StaffType = Literal["single", "grand"]


class PitchSchema(BaseModel):
    step: Step
    octave: int = Field(..., ge=0, le=8)
    accidental: Accidental = "natural"
    solfege: SolfeggioNote
    display_badge_text: str = Field(..., description="E.g. '♭si', 'do', '♯fa'")


class TupletInfoSchema(BaseModel):
    count: int = Field(..., ge=1)
    total: int = Field(..., ge=1)


class NoteSchema(BaseModel):
    id: str
    pitch: Optional[PitchSchema] = None
    is_rest: bool = False
    duration: DurationType
    dots: int = Field(default=0, ge=0, le=2)
    fingering: Optional[Fingering] = None
    lyrics: Optional[str] = None
    tuplet: Optional[TupletInfoSchema] = None
    tie: Optional[Literal["start", "stop", "continue"]] = None


class ChordSymbolSchema(BaseModel):
    id: str
    root: str  # E.g. "Si" or "B"
    quality: str  # E.g. "m", "7", "5dis(7)"
    full_text: str  # E.g. "Si♭7"
    beat: float = Field(..., gt=0)


class TimeSignatureSchema(BaseModel):
    beats: int = Field(..., ge=1)
    beat_type: int = Field(..., ge=1)


class KeySignatureSchema(BaseModel):
    fifths: int = Field(..., ge=-7, le=7)
    mode: Literal["major", "minor"] = "major"
    name: str = "Do Mayor"


class MeasureSchema(BaseModel):
    number: int = Field(..., ge=1)
    time_signature: Optional[TimeSignatureSchema] = None
    key_signature: Optional[KeySignatureSchema] = None
    chords: List[ChordSymbolSchema] = Field(default_factory=list)
    notes: List[NoteSchema] = Field(default_factory=list)
    lower_notes: Optional[List[NoteSchema]] = None


class ScoreMetadataSchema(BaseModel):
    title: str
    composer: str
    subtitle: Optional[str] = None
    arranger: Optional[str] = None
    tempo_bpm: Optional[int] = Field(default=None, ge=20, le=300)
    tempo_text: Optional[str] = None


class ScoreSchema(BaseModel):
    id: str
    metadata: ScoreMetadataSchema
    staff_type: StaffType = "single"
    measures: List[MeasureSchema] = Field(default_factory=list)

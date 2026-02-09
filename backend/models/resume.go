package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ResumeAnalysis struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	CandidateName        string  `json:"candidate_name"` // Extracted from filename or AI
	OriginalFilename     string  `json:"original_filename"`
	Profession           string  `json:"profession"`
	PlacementProbability float64 `json:"placement_probability"`
	Verdict              string  `json:"verdict"`
	MatchPercentage      int     `json:"match_percentage"`
	ContentRating        int     `json:"content_rating"`
	FilePath             string  `json:"file_path"`
	UserID               string  `json:"user_id" gorm:"index"`

	// Store the full complex JSON response from AI
	AIAnalysisData datatypes.JSON `json:"ai_analysis_data"`
}
